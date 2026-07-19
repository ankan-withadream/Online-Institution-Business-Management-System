import { useState, useCallback } from 'react';
import { useUpdateMany, useDeleteMany, useListContext, useNotify } from 'ra-core';
import api from '../services/api';

/**
 * Hook that wires up common bulk actions to the current ra-core list context.
 *
 * Returns:
 *   publish()  - sets `published: true` on all selectedIds via PATCH (uses updateMany PUT fallback)
 *   unpublish() - same, sets `published: false`
 *   remove()   - calls dataProvider.deleteMany (which sends DELETE for each id)
 *   runAction(fn) - generic: runs fn(ids), then refreshes + notifies
 *   isPending, error
 *
 * Note: most admin resources use PATCH for status updates. We use updateMany
 * (which our dataProvider implements via parallel PUTs) for fields like
 * `is_published` since the controllers don't expose partial updates — PUT
 * accepts the full update payload.
 */
export const useBulkActions = (resource, opts = {}) => {
  const { refreshMessage = 'Updated' } = opts;
  const { selectedIds = [], refetch } = useListContext();
  const notify = useNotify();

  const [updateMany, updateState] = useUpdateMany();
  const [deleteMany, deleteState] = useDeleteMany();

  const ids = selectedIds;

  const publish = useCallback(async () => {
    if (!ids.length) return;
    try {
      await updateMany(resource, { ids, data: { is_published: true } });
      notify(`${ids.length} items published`, { type: 'success' });
      refetch();
    } catch (err) {
      notify(err.message || 'Publish failed', { type: 'error' });
    }
  }, [ids, updateMany, resource, notify, refetch]);

  const unpublish = useCallback(async () => {
    if (!ids.length) return;
    try {
      await updateMany(resource, { ids, data: { is_published: false } });
      notify(`${ids.length} items unpublished`, { type: 'success' });
      refetch();
    } catch (err) {
      notify(err.message || 'Unpublish failed', { type: 'error' });
    }
  }, [ids, updateMany, resource, notify, refetch]);

  const remove = useCallback(async () => {
    if (!ids.length) return;
    try {
      await deleteMany(resource, { ids });
      notify(`${ids.length} items deleted`, { type: 'success' });
      refetch();
    } catch (err) {
      notify(err.message || 'Delete failed', { type: 'error' });
    }
  }, [ids, deleteMany, resource, notify, refetch]);

  const runAction = useCallback(async (fn, label = refreshMessage) => {
    if (!ids.length) return;
    try {
      await fn(ids);
      notify(`${ids.length} ${label}`, { type: 'success' });
      refetch();
    } catch (err) {
      notify(err.message || `${label} failed`, { type: 'error' });
    }
  }, [ids, notify, refetch, refreshMessage]);

  return {
    ids,
    publish,
    unpublish,
    remove,
    runAction,
    isPending: updateState.isPending || deleteState.isPending,
    error: updateState.error || deleteState.error,
  };
};

/**
 * Bulk-generate documents (certificates, marksheets, ID cards).
 *
 * Loops over the selected ids and calls the per-row create endpoint sequentially.
 * Keeps the existing per-row behaviour (PDF generation, sequential POSTs) but
 * drops the CSV parsing step entirely — selection drives the action.
 */
export const useBulkGenerate = (createUrl, label = 'Documents') => {
  const { selectedIds = [], refetch } = useListContext();
  const notify = useNotify();
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(async () => {
    if (!selectedIds.length) return;
    setIsPending(true);
    let ok = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await api.post(createUrl, { studentId: id });
        ok++;
      } catch {
        failed++;
      }
    }
    setIsPending(false);
    notify(`${label}: ${ok} generated${failed ? `, ${failed} failed` : ''}`, {
      type: failed ? 'warning' : 'success',
    });
    refetch();
  }, [selectedIds, createUrl, notify, refetch, label]);

  return { run, isPending };
};