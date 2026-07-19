/**
 * Per-resource URL overrides for the dataProvider.
 *
 * Some resources have endpoints that include a dynamic segment (e.g.
 * `/results/student/{studentId}` or `/certificates/student/{studentId}`).
 * Pages can call `setResourceUrl('myResource', '/path/123')` before
 * mounting a DataTable to redirect the dataProvider to a specific URL.
 */

const overrides = new Map();

export const setResourceUrl = (resource, url) => {
  overrides.set(resource, url);
};

export const getResourceUrlOverride = (resource) => overrides.get(resource);

export const clearResourceUrlOverride = (resource) => {
  overrides.delete(resource);
};