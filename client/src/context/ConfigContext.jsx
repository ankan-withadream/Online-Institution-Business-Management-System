/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ConfigContext = createContext(null);
const configUrl = new URL('../config/clientConfig.json', import.meta.url);

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
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadConfig = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(configUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Config request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.error('Failed to load client config:', err);
        setConfig(null);
        setError('Unable to load configuration.');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();

    return () => controller.abort();
  }, []);

  const verifyConfig = useMemo(() => config?.verify ?? {}, [config]);
  const verifyOptions = useMemo(() => verifyConfig.options ?? {}, [verifyConfig]);
  const studentDetailsConfig = useMemo(() => verifyConfig.studentDetails ?? {}, [verifyConfig]);
  const certificateDetailsConfig = useMemo(() => verifyConfig.certificateDetails ?? {}, [verifyConfig]);
  const certificateDisplayConfig = useMemo(() => verifyConfig.certificateDisplay ?? {}, [verifyConfig]);
  const detailLabels = useMemo(() => verifyConfig.detailLabels ?? {}, [verifyConfig]);
  const enabledTypes = useMemo(() => {
    const types = [];
    if (verifyOptions.certificate) types.push('certificate');
    if (verifyOptions.student) types.push('student');
    return types;
  }, [verifyOptions.certificate, verifyOptions.student]);
  const hasEnabledTypes = enabledTypes.length > 0;
  const showTypeSelector = enabledTypes.length > 1;

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
    verifyOptions,
    studentDetailsConfig,
    certificateDetailsConfig,
    certificateDisplayConfig,
    detailLabels,
    enabledTypes,
    hasEnabledTypes,
    showTypeSelector,
    buildDetails,
  }), [
    config,
    loading,
    error,
    verifyConfig,
    verifyOptions,
    studentDetailsConfig,
    certificateDetailsConfig,
    certificateDisplayConfig,
    detailLabels,
    enabledTypes,
    hasEnabledTypes,
    showTypeSelector,
    buildDetails,
  ]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};
