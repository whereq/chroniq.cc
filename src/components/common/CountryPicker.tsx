import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRIES } from '@/data/countries';
import { ChevronDown } from '@/components/icons/Icons';

interface CountryPickerProps {
  value: string;
  onChange: (code: string) => void;
}

function getCountryName(code: string, locale: string): string {
  try {
    const dn = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

export function CountryPicker({ value, onChange }: CountryPickerProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find((c) => c.code === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => {
      const name = getCountryName(c.code, i18n.language).toLowerCase();
      return name.includes(q) || c.code.toLowerCase().includes(q);
    });
  }, [search, i18n.language]);

  return (
    <div className="cpicker" ref={ref}>
      <button
        className="cpicker-trigger"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span className="cpicker-flag">{selected?.flag ?? '🌐'}</span>
        <span className="cpicker-name">
          {selected ? getCountryName(selected.code, i18n.language) : value}
        </span>
        <span className="cpicker-code">{value}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="cpicker-dropdown">
          <div className="cpicker-search">
            <input
              ref={searchRef}
              type="text"
              placeholder={t('panel.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="cpicker-list">
            {filtered.map((c) => (
              <button
                key={c.code}
                className={`cpicker-option${c.code === value ? ' selected' : ''}`}
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch('');
                }}
                type="button"
              >
                <span className="cpicker-flag">{c.flag}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {getCountryName(c.code, i18n.language)}
                </span>
                <span className="cpicker-code">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
