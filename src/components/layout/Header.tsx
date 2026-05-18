import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/logo/Logo';
import { useThemeStore } from '@/store/themeStore';
import { useCalendarStore } from '@/store/calendarStore';
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
  const { view, setView, panelOpen, setPanelOpen } = useCalendarStore();

  const navLinks = [
    { key: 'product', label: t('nav.product') },
    { key: 'solutions', label: t('nav.solutions') },
    { key: 'resources', label: t('nav.resources') },
    { key: 'enterprise', label: t('nav.enterprise') },
    { key: 'pricing', label: t('nav.pricing') },
    { key: 'about', label: t('nav.about') },
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

        {/* Center: nav links */}
        <nav className="header-nav hide-md" style={{ flex: 1, justifyContent: 'center' }}>
          {navLinks.map((link) => (
            <button
              key={link.key}
              className={`nav-link${link.key === 'resources' && view === 'resources' ? ' active' : ''}`}
              onClick={() => {
                if (link.key === 'resources') {
                  setView(view === 'resources' ? 'calendar' : 'resources');
                }
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="header-actions">
          <LangSelector />
          <ThemeToggle />
          <button className="btn btn-outline hide-sm">{t('cta.signin')}</button>
          <button className="btn btn-accent hide-sm">{t('cta.signup')}</button>
        </div>
      </div>
    </header>
  );
}
