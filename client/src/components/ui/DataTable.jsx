import { useMemo } from 'react';
import {
  useListContext,
  useListController,
  useInfiniteListController,
  ResourceContextProvider,
  ListContextProvider,
} from 'ra-core';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { resourceConfig, resolvePath } from '../../config/resourceConfig.jsx';
import SearchInput from './SearchInput';
import Filters from './Filters';
import Pagination from './Pagination';
import BulkActionBar from './BulkActionBar';
import { setResourceUrl } from '../../resourceUrlOverrides';
import './DataTable.css';

/**
 * Generic sortable / selectable / searchable / filterable / paginated data table.
 *
 * <DataTable resource="students" />          // uses defaults from resourceConfig
 * <DataTable resource="students" filters={[{source:'status',label:'Status',options:[…]}]} />
 * <DataTable resource="students" rowActions={(record) => <>…</>} />
 * <DataTable resource="students" toolbar={<>…</>} />     // search + filters
 * <DataTable resource="students" bulkActions={<>…</>} /> // buttons inside BulkActionBar
 * <DataTable resource="students" perPage={50} />
 * <DataTable resource="students" infinite />              // useInfiniteListController
 *
 * Internally it uses useListController (or useInfiniteListController when
 * `infinite` is set) and wraps the children in the standard ListContext,
 * so any child component can call useListContext to read filters, sort,
 * pagination, and selection state.
 */
const DataTable = ({
  resource,
  filters = [],
  rowActions,
  toolbar,
  bulkActions,
  perPage,
  infinite = false,
  emptyMessage = 'No records found',
  showSearch = true,
  showPagination = true,
  columns,
  defaultSort,
  params = {},
  url,
}) => {
  // Use the resource config as defaults; caller can override per-instance.
  const config = resourceConfig[resource] || {};
  const resolvedColumns = columns || config.columns || [];
  const resolvedPerPage = perPage ?? config.perPage ?? 25;
  const resolvedSort = defaultSort || config.defaultSort || { field: 'id', order: 'DESC' };

  return (
    <ResourceContextProvider value={resource}>
      <DataTableInner
        resource={resource}
        filters={filters}
        rowActions={rowActions}
        toolbar={toolbar}
        bulkActions={bulkActions}
        perPage={resolvedPerPage}
        sort={resolvedSort}
        emptyMessage={emptyMessage}
        showSearch={showSearch}
        showPagination={showPagination}
        columns={resolvedColumns}
        infinite={infinite}
        params={params}
        url={url}
      />
    </ResourceContextProvider>
  );
};

const DataTableInner = ({
  resource,
  filters,
  rowActions,
  toolbar,
  bulkActions,
  perPage,
  sort,
  emptyMessage,
  showSearch,
  showPagination,
  columns,
  infinite,
  params,
  url,
  extraData,
}) => {
  // useListController wires up everything: query, filter, sort, pagination,
  // selection, mutations. The dataProvider does the actual fetch.
  // `filter` here seeds the initial filterValues (these come through as
  // dataProvider.filter too), which lets us pre-apply e.g. student_id.
  const controllerProps = (infinite ? useInfiniteListController : useListController)({
    resource,
    perPage,
    sort,
    debounce: 300,
    disableSyncWithLocation: true,
    filter: params,
  });

  // Stash the custom URL in a resource-level context so the dataProvider
  // can read it. We use a tiny module-level variable for this so we don't
  // have to plumb through every layer.
  if (url) {
    setResourceUrl(resource, url);
  }

  return (
    <ListContextProvider value={controllerProps}>
      <DataTableContent
        resource={resource}
        rowActions={rowActions}
        toolbar={toolbar}
        bulkActions={bulkActions}
        emptyMessage={emptyMessage}
        showSearch={showSearch}
        showPagination={showPagination}
        columns={columns}
        filters={filters}
        extraData={extraData}
      />
    </ListContextProvider>
  );
};

// Module-level URL overrides for resources whose endpoints include a dynamic ID
// live in src/resourceUrlOverrides.js. The dataProvider reads them via
// getResourceUrlOverride; this component sets them when a custom `url` prop
// is provided.

const DataTableContent = ({
  resource,
  rowActions,
  toolbar,
  bulkActions,
  emptyMessage,
  showSearch,
  showPagination,
  columns,
  filters = [],
  extraData = null,
}) => {
  // Mark extraData as intentionally read so it doesn't trigger an unused-prop
  // lint error when callers pass per-page derived data.
  void extraData;
  // Now useListContext returns the values populated by useListController.
  const {
    data,
    isPending,
    isFetching,
    error,
    sort: currentSort,
    setSort,
    selectedIds = [],
    onToggleItem,
    onSelect,
  } = useListContext();

  const rows = Array.isArray(data) ? data : [];
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  const onSortClick = (source) => () => {
    if (!source) return;
    const isCurrent = currentSort?.field === source;
    setSort({
      field: source,
      order: isCurrent && currentSort.order === 'ASC' ? 'DESC' : 'ASC',
    });
  };

  const sortedColumns = useMemo(() => columns, [columns]);

  if (error) {
    return <div className="dt-error card">Failed to load: {String(error.message || error)}</div>;
  }

  return (
    <div className="dt-wrapper">
      {(showSearch || toolbar || filters.length > 0) && (
        <div
          className="dt-toolbar"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '0.75rem 0',
          }}
        >
          {showSearch && <SearchInput placeholder={`Search ${resource}…`} />}
          <Filters filters={filters} />
          <div style={{ marginLeft: 'auto' }}>{toolbar}</div>
        </div>
      )}

      {bulkActions && <BulkActionBar>{bulkActions}</BulkActionBar>}

      <div className="card table-container" style={{ position: 'relative' }}>
        {isPending ? (
          <div className="loading-screen">
            <div className="spinner" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {bulkActions && (
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={!!allSelected}
                      onChange={(e) => {
                        if (e.target.checked) onSelect(rows.map((r) => r.id));
                        else onSelect([]);
                      }}
                      aria-label="Select all"
                    />
                  </th>
                )}
                {sortedColumns.map((col) => (
                  <th
                    key={col.source || col.label}
                    onClick={col.sortable ? onSortClick(col.source) : undefined}
                    style={{
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      ...(col.width ? { width: col.width } : {}),
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.sortable && currentSort?.field === col.source && (
                        currentSort.order === 'ASC'
                          ? <ChevronUp size={14} />
                          : <ChevronDown size={14} />
                      )}
                    </span>
                  </th>
                ))}
                {rowActions && (
                  <th style={{ textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => {
                const checked = selectedIds.includes(record.id);
                return (
                  <tr
                    key={record.id}
                    style={{
                      background: checked ? 'var(--primary-soft, #eef2ff)' : undefined,
                    }}
                  >
                    {bulkActions && (
                      <td>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleItem(record.id)}
                          aria-label={`Select ${record.id}`}
                        />
                      </td>
                    )}
                    {sortedColumns.map((col) => {
                      const value = resolvePath(record, col.source);
                      const rendered = col.render ? col.render(value, record, extraData) : value ?? '-';
                      return <td key={col.source || col.label}>{rendered}</td>;
                    })}
                    {rowActions && (
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {rowActions(record)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {isFetching && !isPending && (
          <div className="dt-refresh-overlay">
            <div className="spinner" style={{ width: '24px', height: '24px' }} />
          </div>
        )}
        {!isPending && !isFetching && rows.length === 0 && (
          <div className="empty-state">
            <p>{emptyMessage}</p>
          </div>
        )}
        {showPagination && !isPending && rows.length > 0 && <Pagination />}
      </div>
    </div>
  );
};


export default DataTable;
