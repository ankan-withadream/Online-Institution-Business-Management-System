import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useListContext } from 'ra-core';

/**
 * Debounced search input. Bound to the current ra-core list context's
 * `filterValues.q`. Calls `setFilters` after 300ms of inactivity.
 */
const SearchInput = ({ placeholder = 'Search…', width = 280 }) => {
  const { filterValues, setFilters } = useListContext();
  const [value, setValue] = useState(() => filterValues?.q || '');
  const timer = useRef(null);

  // Sync local input with the filterValues.q that may be set externally
  // (e.g. clearing all filters). We skip the update when the user is the
  // source of the change (already reflected in `value`).
  const externalQ = filterValues?.q || '';
  useEffect(() => {
    if (externalQ !== value) {
      setValue(externalQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQ]);

  const onChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setFilters({ ...filterValues, q: v || undefined }, undefined, true);
    }, 300);
  };

  return (
    <div className="dt-search" style={{ position: 'relative', width }}>
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--muted, #6b7280)',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="dt-search-input"
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem 0.5rem 2.25rem',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 8,
          fontSize: '0.875rem',
          background: 'var(--bg, white)',
          color: 'var(--fg, #111827)',
        }}
      />
    </div>
  );
};

export default SearchInput;