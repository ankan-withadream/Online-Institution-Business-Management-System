import { useListContext } from 'ra-core';
import { X } from 'lucide-react';

/**
 * Floating action bar that renders when one or more rows are selected.
 * Children should be the action buttons. Also shows the current selection
 * count and a "clear" button.
 */
const BulkActionBar = ({ children }) => {
  const { selectedIds = [], onUnselectItems } = useListContext();

  if (!selectedIds.length) return null;

  return (
    <div
      className="dt-bulk-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0.5rem 1rem',
        background: 'var(--primary-soft, #eef2ff)',
        border: '1px solid var(--primary, #6366f1)',
        borderRadius: 8,
        marginBottom: '0.75rem',
      }}
    >
      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
        {selectedIds.length} selected
      </span>
      <div style={{ display: 'flex', gap: 8, flex: 1 }}>{children}</div>
      <button
        type="button"
        onClick={() => onUnselectItems()}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted, #6b7280)',
          display: 'inline-flex',
          alignItems: 'center',
          padding: 4,
        }}
        title="Clear selection"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default BulkActionBar;