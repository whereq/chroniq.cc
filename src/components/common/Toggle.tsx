interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color: string;
  label: string;
  count?: number;
}

export function Toggle({ checked, onChange, color, label, count }: ToggleProps) {
  return (
    <div
      className="toggle-row"
      role="button"
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onChange(!checked);
      }}
    >
      <span className="toggle-label">
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        {label}
        {count !== undefined && (
          <span className="toggle-count">{count}</span>
        )}
      </span>
      <button
        className="toggle-switch"
        style={{ background: checked ? color : 'var(--border-strong)' }}
        aria-checked={checked}
        role="switch"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
      >
        <span
          className="toggle-thumb"
          style={{ left: checked ? 14 : 2 }}
        />
      </button>
    </div>
  );
}
