import { useListContext } from 'ra-core';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Page + per-page controls driven by the ra-core list context.
 * `pageInfo` from the dataProvider's getList response drives hasNextPage.
 */
const Pagination = () => {
  const {
    page,
    perPage,
    total,
    setPage,
    setPerPage,
    hasPreviousPage,
    hasNextPage,
  } = useListContext();

  const totalPages = Math.max(1, Math.ceil((total || 0) / (perPage || 25)));

  return (
    <div
      className="dt-pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border, #e5e7eb)',
        fontSize: '0.875rem',
        color: 'var(--muted, #6b7280)',
      }}
    >
      <div>
        {total > 0 ? (
          <>
            Showing <strong>{(page - 1) * perPage + 1}</strong>–
            <strong>{Math.min(page * perPage, total)}</strong> of{' '}
            <strong>{total}</strong>
          </>
        ) : (
          'No results'
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={perPage}
          onChange={(e) => setPerPage(parseInt(e.target.value, 10))}
          style={{
            padding: '0.25rem 0.5rem',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 6,
            fontSize: '0.875rem',
            background: 'var(--bg, white)',
          }}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!hasPreviousPage}
          onClick={() => setPage(page - 1)}
          style={btnStyle(!hasPreviousPage)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={!hasNextPage}
          onClick={() => setPage(page + 1)}
          style={btnStyle(!hasNextPage)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const btnStyle = (disabled) => ({
  padding: '0.25rem 0.5rem',
  border: '1px solid var(--border, #e5e7eb)',
  borderRadius: 6,
  background: disabled ? 'var(--bg-disabled, #f3f4f6)' : 'var(--bg, white)',
  color: disabled ? 'var(--muted, #9ca3af)' : 'var(--fg, #111827)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
});

export default Pagination;