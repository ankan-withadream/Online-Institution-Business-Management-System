import { format } from 'date-fns';

export const Code = (val) => <code>{val}</code>;

export const StatusBadge = (val) => {
  const variant =
    val === 'active' || val === 'completed' || val === 'approved' || val === 'pass' || val === 'passed'
      ? 'success'
      : val === 'graduated' || val === 'ongoing' || val === 'scheduled'
        ? 'info'
        : val === 'pending' || val === 'partial'
          ? 'warning'
          : 'danger';
  return <span className={`badge badge-${variant}`}>{val}</span>;
};

export const DateCell = (val) => (val ? format(new Date(val), 'PP') : '-');
export const DateTimeCell = (val) => (val ? format(new Date(val), 'PP p') : '-');
export const CurrencyCell = (val) => (val != null ? `₹${Number(val).toLocaleString('en-IN')}` : '-');
export const Dot = (val, key) => (val?.[key] ?? '-');
export const Truthy = (val) => (val ? 'Yes' : 'No');