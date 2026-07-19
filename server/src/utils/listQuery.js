/**
 * Shared list-query helper.
 *
 * Parses common pagination/sort/filter/search params from req.query and applies
 * them to a Supabase query. Returns a { data, total, page, perPage } envelope.
 *
 * Query parameters:
 *   page (1-based)       default 1
 *   perPage              default 25, max 200
 *   sort                 column name; must be in `sortable` whitelist
 *   order                'asc' | 'desc' (default 'desc')
 *   q                    free-text search across `searchable` columns (ILIKE %q%)
 *   filter[col]          repeatable equality filter; column must be in `filterable`
 *
 * Supabase PostgREST notes:
 *   - .range(from, to) is inclusive on both ends and zero-based.
 *   - .order(...) supports nested-table ordering via dot notation (e.g. "users.full_name").
 *   - For nested ordering to work the parent table must be selected with a join.
 *   - For nested text search we fall back to a separate users-table filter and intersect.
 */

const MAX_PER_PAGE = 200;
const DEFAULT_PER_PAGE = 25;

const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const parseListParams = (req, opts = {}) => {
  const { sortable = [], searchable = [], filterable = [] } = opts;

  const page = toInt(req.query.page, 1);
  const perPage = Math.min(toInt(req.query.perPage, DEFAULT_PER_PAGE), MAX_PER_PAGE);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let sort = req.query.sort;
  let order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  // If sort is requested but not allowed, fall back to default
  if (sort && sortable.length && !sortable.includes(sort)) {
    sort = undefined;
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  // filter[*] keys
  const filters = {};
  for (const [key, value] of Object.entries(req.query)) {
    const m = key.match(/^filter\[(.+)\]$/);
    if (m && filterable.includes(m[1])) {
      const v = Array.isArray(value) ? value[value.length - 1] : value;
      if (v !== '' && v !== undefined && v !== null) filters[m[1]] = String(v);
    }
  }

  return { page, perPage, from, to, sort, order, q, filters, searchable, filterable };
};

/**
 * Apply pagination + sort + search + filter to a Supabase query.
 * Returns the post-rest query (still chained-awaitable) plus the parsed params.
 *
 * Nested search: if `q` matches a column like `users.full_name` or `users.email`,
 * we apply a separate `.or('users.full_name.ilike.%q%,users.email.ilike.%q%')`
 * filter instead of the per-column ILIKE.
 */
export const applyListQuery = (query, req, opts = {}) => {
  const params = parseListParams(req, opts);

  // Pagination + count
  query = query.range(params.from, params.to);

  // Total count requires count: 'exact' on the .select(...) call.
  // We can't change the existing .select(...) options from here without breaking
  // the caller's selection string. Instead, callers must call .select(cols, { count: 'exact' }).
  // We document this in the helper.

  // Sort
  if (params.sort) {
    query = query.order(params.sort, { ascending: params.order === 'asc' });
  }

  // Equality filters
  for (const [col, val] of Object.entries(params.filters)) {
    query = query.eq(col, val);
  }

  // Free-text search
  if (params.q && params.searchable.length) {
    const escaped = params.q.replace(/[%_]/g, (m) => '\\' + m);
    const pattern = `%${escaped}%`;
    // Group searchable columns into a single .or() for efficiency.
    // Filter only the local-table columns; nested-table columns are handled
    // by passing `nestedSearchable` and an extra OR.
    const local = params.searchable.filter((c) => !c.includes('.'));
    const nested = params.searchable.filter((c) => c.includes('.'));

    if (local.length) {
      const ors = local.map((c) => `${c}.ilike.${pattern}`).join(',');
      query = query.or(ors);
    }
    if (nested.length && opts.nestedSearchHandler) {
      query = opts.nestedSearchHandler(query, pattern, nested);
    }
  }

  return { query, params };
};

/**
 * Finalize a list response.
 * @param {object} res Express response
 * @param {object} result Supabase query result with { data, count, error }
 * @param {object} params Parsed params from applyListQuery
 */
export const respondList = (res, result, params) => {
  if (result.error) throw result.error;
  res.json({
    data: result.data || [],
    total: typeof result.count === 'number' ? result.count : 0,
    page: params.page,
    perPage: params.perPage,
  });
};