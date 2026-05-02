import { useState } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

const MultiSelect = ({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select options...',
  disabled = false,
  renderOption,
  onBlur,
  containerStyle,
}) => {
  const [open, setOpen] = useState(false);
  const normalizedSelected = Array.isArray(selected) ? selected : [];
  const selectedOptions = options.filter(option => normalizedSelected.includes(option.value));

  const toggle = (value) => {
    if (normalizedSelected.includes(value)) {
      onChange(normalizedSelected.filter(v => v !== value));
    } else {
      onChange([...normalizedSelected, value]);
    }
  };

  const close = () => {
    setOpen(false);
    if (onBlur) onBlur();
  };

  return (
    <div className="form-group" style={{ margin: 0, position: 'relative', flex: 1, ...containerStyle }}>
      {label && <label className="form-label">{label}</label>}
      <div
        onClick={() => !disabled && setOpen(!open)}
        className="form-input"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer', minHeight: '42px',
          opacity: disabled ? 0.5 : 1, userSelect: 'none', flexWrap: 'wrap', gap: '0.25rem',
          background: disabled ? 'var(--gray-100)' : undefined,
        }}
      >
        {selectedOptions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', flex: 1 }}>
            {selectedOptions.map(option => (
              <span key={option.value} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                background: 'var(--primary-100, #dbeafe)', color: 'var(--primary-700, #1d4ed8)',
                borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.8rem', fontWeight: 500,
              }}>
                {option.label}
                <X
                  size={12}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); toggle(option.value); }}
                />
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#9ca3af' }}>{placeholder}</span>
        )}
        <ChevronDown size={16} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </div>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={close}
          />
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)', maxHeight: '220px', overflowY: 'auto',
            marginTop: '4px',
          }}>
            {options.length === 0 ? (
              <div style={{ padding: '0.75rem 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>No options available</div>
            ) : (
              options.map(option => (
                <div
                  key={option.value}
                  onClick={() => toggle(option.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.875rem',
                    background: normalizedSelected.includes(option.value) ? 'var(--primary-50, #eff6ff)' : 'transparent',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!normalizedSelected.includes(option.value)) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!normalizedSelected.includes(option.value)) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                    border: normalizedSelected.includes(option.value) ? '2px solid var(--primary-600, #2563eb)' : '2px solid #d1d5db',
                    background: normalizedSelected.includes(option.value) ? 'var(--primary-600, #2563eb)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {normalizedSelected.includes(option.value) && <Check size={12} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    {renderOption ? renderOption(option) : option.label}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MultiSelect;
