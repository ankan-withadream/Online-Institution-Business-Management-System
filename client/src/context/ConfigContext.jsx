/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import clientConfig from '../config/clientConfig.json';

const ConfigContext = createContext(null);

const formatLabel = (key = '') => {
  const normalized = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();

  if (!normalized) return '';

  return normalized
    .split(' ')
    .map((word) => {
      if (/^id$/i.test(word)) return 'ID';
      if (/^url$/i.test(word)) return 'URL';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

const resolveDetailEntry = (value) => {
  if (typeof value === 'boolean') return { enabled: value, label: undefined };
  if (value && typeof value === 'object') {
    return {
      enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
      label: value.label,
    };
  }
  return { enabled: false, label: undefined };
};

const buildDetailItems = (detailsConfig = {}, data = {}, labelOverrides = {}) => (
  Object.entries(detailsConfig).reduce((acc, [key, value]) => {
    const { enabled, label } = resolveDetailEntry(value);
    if (!enabled) return acc;
    const detailValue = data?.[key];
    if (detailValue === undefined || detailValue === null || detailValue === '') return acc;
    acc.push({
      key,
      label: label || labelOverrides?.[key] || formatLabel(key),
      value: detailValue,
    });
    return acc;
  }, [])
);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
};

export const ConfigProvider = ({ children }) => {
  const config = clientConfig;
  const loading = false;
  const error = '';
  const verifyConfig = useMemo(() => config?.verify ?? {}, [config]);
  const detailLabels = useMemo(() => verifyConfig.detailLabels ?? {}, [verifyConfig]);

  const buildDetails = useCallback(
    (detailsConfig, data, labelOverrides) => (
      buildDetailItems(detailsConfig, data, labelOverrides ?? detailLabels)
    ),
    [detailLabels]
  );

  const value = useMemo(() => ({
    config,
    loading,
    error,
    verifyConfig,
    detailLabels,
    buildDetails,
  }), [
    config,
    loading,
    error,
    verifyConfig,
    detailLabels,
    buildDetails,
  ]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};
