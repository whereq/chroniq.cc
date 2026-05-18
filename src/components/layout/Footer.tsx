import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-slogan">
          <span className="dot" title={t('footer.statusOp')} />
          <span>{t('footer.tag')}</span>
        </div>
        <span className="footer-copy">{t('footer.copyright')}</span>
      </div>
    </footer>
  );
}
