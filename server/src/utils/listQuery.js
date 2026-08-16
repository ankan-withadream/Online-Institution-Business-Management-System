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
 *   - Free-text search: local columns go in the main `.or()`; nested columns
 *     (e.g. `users.full_name`) are resolved via a separate query on the related
 *     table (see resolveNestedSearch) and matched by FK ids, because PostgREST
 *     `.or()` only accepts top-level-table columns.
 */

import { supabaseAdmin } from '../config/supabase.js';

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
 * Resolve a nested-table text search into per-FK id clauses for the top table.
 *
 * PostgREST's `.or()` only accepts columns of the top-level table, so a
 * `users.full_name` reference inside `.or()` fails with PGRST100. Instead we
 * query each leaf table directly for matching rows, walk the FK chain back up
 * to the first-level related table, and return one `{ fk, ids }` clause per
 * nested path. The caller turns each into `fk.in.(ids)` inside the main `.or()`.
 *
 * A nested column path like "students.users.full_name" on fee_payments means:
 *   - fee_payments.student_id -> students -> students.user_id -> users
 *   - match users.full_name, collect the matching user ids
 *   - collect the students whose user_id is in those ids
 *   - emit { fk: 'student_id', ids: those student ids } for the fee_payments query
 *
 * `fkMap` maps each nested path to the FK column the *immediately containing*
 * table uses to reference its child: `{ students: 'student_id',
 * 'students.users': 'user_id' }` for the path above.
 *
 * @param {string[]} searchable full searchable column list (local + nested)
 * @param {string} pattern the ILIKE pattern, e.g. "%john%"
 * @param {object} fkMap { nestedPath: fkColumn } for every nested path
 * @returns {Promise<Array<{fk: string, ids: string[]}>>} clauses for the main `.or()`
 */
export const resolveNestedSearch = async (searchable, pattern, fkMap) => {
  // Group leaf-table search columns by nested path.
  const tables = {};
  for (const col of searchable) {
    if (!col.includes('.')) continue;
    const parts = col.split('.');
    const leafCol = parts.pop();
    const path = parts.join('.');
    if (!fkMap[path]) continue;
    (tables[path] ||= []).push(leafCol);
  }

  // Resolve each path independently; union their clauses in the caller's OR.
  const clauses = [];
  for (const [path, leafCols] of Object.entries(tables)) {
    const segments = path.split('.');
    const ors = leafCols.map((c) => `${c}.ilike.${pattern}`).join(',');

    // Leaf table: find matching rows (every table's PK is `id`).
    const { data, error } = await supabaseAdmin
      .from(segments[segments.length - 1])
      .select('id')
      .or(ors);
    if (error) throw error;
    let ids = new Set((data || []).map((r) => String(r.id)).filter(Boolean));
    if (!ids.size) continue; // nothing matched along this path

    // Walk back up: the FK on the parent referencing the child is fkMap[prefix].
    for (let i = segments.length - 1; i > 0; i--) {
      const fk = fkMap[segments.slice(0, i + 1).join('.')];
      const parentTable = segments[i - 1];
      const { data: parents, error: parentErr } = await supabaseAdmin
        .from(parentTable)
        .select('id')
        .in(fk, [...ids]);
      if (parentErr) throw parentErr;
      ids = new Set((parents || []).map((r) => String(r.id)).filter(Boolean));
      if (!ids.size) break;
    }
    if (ids.size) clauses.push({ fk: fkMap[segments[0]], ids: [...ids] });
  }

  return clauses;
};

/**
 * Apply pagination + sort + search + filter to a Supabase query.
 * Returns the post-rest query (still chained-awaitable) plus the parsed params.
 *
 * Free-text search: local columns go into the main `.or()`. Nested columns
 * (like `users.full_name`) are resolved first via `resolveNestedSearch` and
 * their matching parent ids combined into the same `.or()` as `fk.in.(...)`.
 *
 * `opts`:
 *   searchable   columns to search across (local + nested)
 *   nestedFk     one entry per FK hop. Each key is a nested path, each value
 *                is the FK column the *containing* table uses to reference the
 *                child at that hop. Examples:
 *                - students table, nested `users.full_name`:
 *                  { users: 'user_id' }
 *                - fee_payments table, nested `students.users.full_name`:
 *                  { students: 'student_id', 'students.users': 'user_id' }
 */
export const applyListQuery = async (query, req, opts = {}) => {
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
    const ors = [];
    // Local-table columns can be filtered directly.
    for (const col of params.searchable) {
      if (!col.includes('.')) ors.push(`${col}.ilike.${pattern}`);
    }
    // Nested-table columns: resolve to first-level FK id clauses, then OR them.
    if (ors.length < params.searchable.length && opts.nestedFk) {
      const clauses = await resolveNestedSearch(params.searchable, pattern, opts.nestedFk);
      for (const clause of clauses) {
        ors.push(`${clause.fk}.in.(${clause.ids.join(',')})`);
      }
    }
    if (ors.length) query = query.or(ors.join(','));
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