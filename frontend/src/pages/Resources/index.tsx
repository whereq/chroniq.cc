import { useTranslation } from 'react-i18next';

const RESOURCE_COLORS: Record<string, string> = {
  api: 'var(--tile-blue)',
  docs: 'var(--tile-teal)',
  blog: 'var(--tile-amber)',
  help: 'var(--tile-emerald)',
  terms: 'var(--tile-violet)',
};

const RESOURCE_ICONS: Record<string, string> = {
  api: '⚡',
  docs: '📖',
  blog: '✍️',
  help: '💬',
  terms: '📋',
};

export function ResourcesPage() {
  const { t } = useTranslation();

  const items = ['api', 'docs', 'blog', 'help', 'terms'];

  return (
    <div className="resources-page">
      <h1 className="resources-title">{t('resources.title')}</h1>
      <p className="resources-sub">{t('resources.sub')}</p>
      <div className="resources-grid">
        {items.map((key) => {
          const title = t(`resources.items.${key}.title`);
          const desc = t(`resources.items.${key}.desc`);
          const tag = t(`resources.items.${key}.tag`);
          const color = RESOURCE_COLORS[key];
          const icon = RESOURCE_ICONS[key];

          return (
            <div key={key} className="resource-tile">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--r-sm)',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  marginBottom: 6,
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              <div className="resource-tile-header">
                <span className="resource-tile-title">{title}</span>
                <span className="resource-tile-tag">{tag}</span>
              </div>
              <p className="resource-tile-desc">{desc}</p>
              <div className="resource-tile-open">
                {t('resources.open')}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
