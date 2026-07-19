import { useListContext } from 'ra-core';

/**
 * Simple filter row. Renders one <select> per filter defined in `filters`.
 * Each entry: { source, label, options: [{value, label}] }
 * "all" option is added automatically as empty value (clear filter).
 */
const Filters = ({ filters = [] }) => {
  const { filterValues, setFilters } = useListContext();

  if (!filters.length) return null;

  const onChange = (source) => (e) => {
    const v = e.target.value;
    setFilters({ ...filterValues, [source]: v || undefined }, undefined, true);
  };

  return (
    <div className="dt-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {filters.map((f) => (
        <select
          key={f.source}
          value={filterValues?.[f.source] || ''}
          onChange={onChange(f.source)}
          className="dt-filter-select"
          style={{
            padding: '0.4rem 0.6rem',
            border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 8,
            fontSize: '0.875rem',
            background: 'var(--bg, white)',
            color: 'var(--fg, #111827)',
            minWidth: 140,
          }}
        >
          <option value="">All {f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
};

export default Filters;