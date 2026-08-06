import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PiSignInBold, PiSignOutBold } from 'react-icons/pi';
import { Logo } from '@/components/logo/Logo';
import { UserAvatar } from '@/components/common/UserAvatar';
import { useThemeStore } from '@/store/themeStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useAuth } from '@/auth/AuthProvider';
import { useAvatar } from '@/contexts/useAvatarContext';
import { Sun, Moon, Globe, Menu, ChevronDown } from '@/components/icons/Icons';

const LOCALES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zh', label: '中', name: '中文' },
  { code: 'ja', label: 'JP', name: '日本語' },
  { code: 'ko', label: 'KR', name: '한국어' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'fr', label: 'FR', name: 'Français' },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button
      className="btn-icon"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function LangSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === i18n.language) ?? LOCALES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('chroniq-cc-lang', code);
    setOpen(false);
  };

  return (
    <div className="lang-selector" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen((o) => !o)}>
        <Globe size={12} />
        <span>{current.label}</span>
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="lang-dropdown">
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              className={`lang-option${i18n.language === locale.code ? ' selected' : ''}`}
              onClick={() => handleSelect(locale.code)}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7, minWidth: 20 }}>
                {locale.label}
              </span>
              <span>{locale.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { view, panelOpen, setPanelOpen } = useCalendarStore();
  const { isAuthenticated, login, logout } = useAuth();
  const { effectiveUrl } = useAvatar();

  // Marketing nav points at real landing-page sections (anchors); dead links
  // (Solutions/Enterprise/About) were removed.
  const navLinks = [
    { href: '#features', label: t('nav.features') },
    { href: '#how-it-works', label: t('nav.how_it_works') },
    { href: '#pricing', label: t('nav.pricing') },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        {/* Left: panel toggle + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {view === 'calendar' && (
            <button
              className="btn-icon"
              onClick={() => setPanelOpen(!panelOpen)}
              title="Toggle panel"
            >
              <Menu size={16} />
            </button>
          )}
          <a href="/" className="brand">
            <Logo size="sm" showWordmark />
          </a>
        </div>

        {/* Center: nav links — app nav when signed in, marketing nav otherwise */}
        <nav className="header-nav hide-md" style={{ flex: 1, justifyContent: 'center' }}>
          {isAuthenticated ? (
            <>
              <a href="/" className="nav-link">{t('nav.calendar')}</a>
              <a href="/dashboard" className="nav-link">{t('nav.manage')}</a>
            </>
          ) : (
            navLinks.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))
          )}
        </nav>

        {/* Right: actions */}
        <div className="header-actions">
          <LangSelector />
          <ThemeToggle />
          <div className="auth-cluster">
            <span
              className="auth-avatar"
              title={isAuthenticated ? t('cta.account') : t('cta.guest')}
            >
              <UserAvatar
                avatar={isAuthenticated ? effectiveUrl : null}
                isAuthenticated={isAuthenticated}
                size={24}
              />
            </span>
            {isAuthenticated ? (
              <button
                className="btn-icon auth-btn"
                title={t('cta.signout')}
                onClick={() => logout()}
                style={{ '--auth-hover': 'var(--tile-coral)' } as React.CSSProperties}
              >
                <PiSignOutBold size={18} />
              </button>
            ) : (
              <button
                className="btn-icon auth-btn"
                title={t('cta.signin')}
                onClick={() => login()}
                style={{ '--auth-hover': 'var(--accent)' } as React.CSSProperties}
              >
                <PiSignInBold size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
