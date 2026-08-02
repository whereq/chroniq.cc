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
        viewBox="0 0 36 36"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-svg brand-mark"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Binding rings */}
        <rect x="9"  y="2" width="3" height="7" fill="var(--border-strong)" className="bm-ring bm-ring-l" />
        <rect x="24" y="2" width="3" height="7" fill="var(--border-strong)" className="bm-ring bm-ring-r" />
        {/* Calendar body */}
        <rect x="3" y="6" width="30" height="28" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1" />
        {/* Header strip */}
        <rect x="3" y="6" width="30" height="7" fill="var(--tile-coral)" />
        {/* Q ring */}
        <circle cx="17" cy="22" r="6.5" fill="none" stroke="var(--accent)" strokeWidth="2" className="bm-q-ring" />
        {/* Q tail */}
        <line x1="21" y1="26" x2="27" y2="32" stroke="var(--accent)" strokeWidth="2" strokeLinecap="square" className="bm-q-tail" />
        {/* Today tile pulsing inside Q */}
        <rect x="15.5" y="20.5" width="3" height="3" fill="var(--tile-amber)" className="bm-today" />
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
