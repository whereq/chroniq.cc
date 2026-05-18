interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const ICON_SIZE = { sm: 24, md: 32, lg: 48 };

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const px = ICON_SIZE[size];
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 15 : 20;

  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-svg"
        style={{ flexShrink: 0 }}
      >
        {/* Two binding rings */}
        <g className="logo-rings">
          <rect x="9" y="1" width="4" height="6" rx="2" fill="#FFB400" />
          <rect x="19" y="1" width="4" height="6" rx="2" fill="#FFB400" />
        </g>
        {/* Calendar body */}
        <rect x="3" y="4" width="26" height="25" rx="2" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1" />
        {/* Red header strip */}
        <rect x="3" y="4" width="26" height="8" rx="2" fill="#FF5A4E" />
        <rect x="3" y="8" width="26" height="4" fill="#FF5A4E" />
        {/* Grid of day squares */}
        <rect x="7" y="16" width="4" height="4" rx="1" fill="var(--border)" />
        <rect x="14" y="16" width="4" height="4" rx="1" fill="#0091FF" />
        <rect x="21" y="16" width="4" height="4" rx="1" fill="var(--border)" />
        <rect x="7" y="23" width="4" height="4" rx="1" fill="var(--border)" />
        <rect x="14" y="23" width="4" height="4" rx="1" fill="var(--border)" />
        <rect x="21" y="23" width="4" height="4" rx="1" fill="var(--border)" />
      </svg>
      {showWordmark && (
        <span
          className="brand-cc"
          style={{ fontSize }}
        >
          chroniq<span>.cc</span>
        </span>
      )}
    </div>
  );
}
