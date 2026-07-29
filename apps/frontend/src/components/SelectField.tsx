import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  style?: React.CSSProperties;
}

/** Select cross-browser consistente con text inputs (funciona en Safari) */
export function SelectField({ value, onChange, options, placeholder = 'Todos', style }: Props) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.5rem',
          padding: '0.375rem 2rem 0.375rem 0.75rem',
          fontSize: '0.75rem',
          color: value ? 'white' : 'oklch(0.40 0 0)',
          outline: 'none',
          cursor: 'pointer',
          ...style,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#0c0c0e', color: 'white' }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        style={{
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'oklch(0.42 0 0)',
          pointerEvents: 'none',
          flexShrink: 0,
        }}
      />
    </div>
  );
}
