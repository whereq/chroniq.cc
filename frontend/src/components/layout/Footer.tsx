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
        <div className="footer-links">
          <a href="/privacy">{t('footer.privacy')}</a>
          <a href="/terms">{t('footer.terms')}</a>
          <span className="footer-copy">{t('footer.copyright')}</span>
        </div>
      </div>
    </footer>
  );
}
