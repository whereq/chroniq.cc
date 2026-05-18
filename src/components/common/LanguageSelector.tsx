import { useTranslation } from 'react-i18next'

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中' },
  { code: 'ja', label: 'JP' },
  { code: 'ko', label: 'KR' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
  { code: 'it', label: 'IT' },
  { code: 'fr', label: 'FR' },
]

export function LanguageSelector() {
  const { i18n } = useTranslation()

  const handleChange = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('chroniq-cc-lang', code)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', padding: 2 }}>
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          style={{
            padding: '2px 6px',
            borderRadius: 'var(--r-sm)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: i18n.language === code ? 'var(--surface)' : 'transparent',
            color: i18n.language === code ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
