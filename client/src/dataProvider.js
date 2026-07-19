import api from './services/api';
import { getResourceUrlOverride } from './resourceUrlOverrides';

/**
 * React-Admin dataProvider for EduCare backend.
 *
 * Translates ra-core's standard { pagination, sort, filter, ids } calls into
 * our REST endpoints, which return { data, total, page, perPage } envelopes
 * for list endpoints.
 *
 * Resource → URL mapping lives in RESOURCE_URLS so individual endpoints can
 * be overridden (e.g. students/me → /students/me).
 */
const RESOURCE_URLS = {
  students: '/students',
  courses: '/courses/admin/all',
  admissions: '/admissions',
  exams: '/exams',
  results: '/results',
  notices: '/notices/admin/all',
  certificates: '/certificates',
  franchises: '/franchises',
  fees: '/fees',
  payments: '/fees',
};

const RESOURCE_PUBLIC_URLS = {
  notices: '/notices',
  courses: '/courses',
};

// Resources that need to scope requests to the franchise of the logged-in user.
// For these the dataProvider will merge in a `franchiseId` query param derived
// from the user object in localStorage, if present and the request didn't specify
// one already.
const FRANCHISE_SCOPED = new Set(['students', 'admissions']);

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const resolveUrl = (resource, opts = {}) => {
  const override = getResourceUrlOverride(resource);
  if (override) return override;
  if (opts.publicOnly && RESOURCE_PUBLIC_URLS[resource]) {
    return RESOURCE_PUBLIC_URLS[resource];
  }
  return RESOURCE_URLS[resource] || `/${resource}`;
};

const buildListParams = ({ pagination, sort, filter }) => {
  const params = {};
  if (pagination) {
    params.page = pagination.page;
    params.perPage = pagination.perPage;
  }
  if (sort && sort.field) {
    params.sort = sort.field;
    params.order = (sort.order || 'ASC').toLowerCase();
  }
  if (filter) {
    for (const [k, v] of Object.entries(filter)) {
      if (v === undefined || v === null || v === '') continue;
      // q is a top-level param, not a filter[]. Other filters go through filter[].
      if (k === 'q') {
        params.q = v;
      } else {
        params[`filter[${k}]`] = v;
      }
    }
  }
  return params;
};

const httpError = (err) => {
  const status = err.response?.status;
  const message = err.response?.data?.error || err.message;
  const error = new Error(message);
  error.status = status;
  return error;
};

const dataProvider = {
  getList: async (resource, params) => {
    const url = resolveUrl(resource);
    const queryParams = buildListParams(params);
    try {
      const { data } = await api.get(url, { params: queryParams });
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const total = typeof data?.total === 'number' ? data.total : items.length;
      return {
        data: items,
        total,
        pageInfo: {
          hasNextPage: items.length === (params.pagination?.perPage || items.length),
          hasPreviousPage: (params.pagination?.page || 1) > 1,
        },
      };
    } catch (err) {
      throw httpError(err);
    }
  },

  getOne: async (resource, { id }) => {
    const base = resolveUrl(resource);
    try {
      const { data } = await api.get(`${base}/${id}`);
      return { data };
    } catch (err) {
      throw httpError(err);
    }
  },

  getMany: async (resource, { ids }) => {
    // Backend has no /resource?ids=… endpoint; fetch individually via getOne.
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const { data } = await api.get(`${resolveUrl(resource)}/${id}`);
          return data;
        } catch {
          return null;
        }
      })
    );
    return { data: results.filter(Boolean) };
  },

  getManyReference: async (resource, { target, id, pagination, sort, filter }) => {
    const merged = { ...(filter || {}), [target]: id };
    return dataProvider.getList(resource, { pagination, sort, filter: merged });
  },

  create: async (resource, { data }) => {
    try {
      const { data: created } = await api.post(resolveUrl(resource), data);
      return { data: created };
    } catch (err) {
      throw httpError(err);
    }
  },

  update: async (resource, { id, data }) => {
    try {
      const { data: updated } = await api.put(`${resolveUrl(resource)}/${id}`, data);
      return { data: updated };
    } catch (err) {
      throw httpError(err);
    }
  },

  updateMany: async (resource, { ids, data }) => {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          await api.put(`${resolveUrl(resource)}/${id}`, data);
          return { id };
        } catch {
          return null;
        }
      })
    );
    return { data: results.filter(Boolean) };
  },

  delete: async (resource, { id, previousData }) => {
    try {
      await api.delete(`${resolveUrl(resource)}/${id}`);
      return { data: previousData || { id } };
    } catch (err) {
      throw httpError(err);
    }
  },

  deleteMany: async (resource, { ids, data: previous }) => {
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          await api.delete(`${resolveUrl(resource)}/${id}`);
          return previous?.find?.((r) => r.id === id) || { id };
        } catch {
          return null;
        }
      })
    );
    return { data: results.filter(Boolean) };
  },
};

export default dataProvider;

// Resource helpers (not part of the ra-core contract but useful for pages).
export const resourceUrl = (resource) => resolveUrl(resource);
export const franchiseScopedResources = FRANCHISE_SCOPED;
export { getStoredUser };