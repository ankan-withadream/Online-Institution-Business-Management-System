import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Generic data-fetching hook.
 * @param {string} url - API endpoint
 * @param {object} options - { immediate: true }
 */
export const useFetch = (url, options = {}) => {
  const { immediate = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data: responseData } = await api.get(url, { params });
      setData(responseData);
      return responseData;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate) fetchData();
  }, [immediate, fetchData]);

  return { data, loading, error, refetch: fetchData };
};
