import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/store/calendarStore';
import { getWesternFortune, getChineseFortune } from '@/utils/fortuneUtils';
import { getWeatherForecast } from '@/utils/weatherUtils';
import { getLunar, solarTermFor } from '@/utils/lunarUtils';
import { Star } from '@/components/icons/Icons';

export function FortuneIcon() {
  const { t, i18n } = useTranslation();
  const { cursor, filters } = useCalendarStore();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const cursorDate = new Date(cursor);
  const western = getWesternFortune(cursorDate, i18n.language);
  const weather = getWeatherForecast(filters.region, cursorDate);
  const cn = getChineseFortune(cursorDate, weather);
  const lunar = getLunar(cursorDate);
  const term = solarTermFor(cursorDate);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Position popover
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        className="fortune-trigger"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <Star size={13} color="var(--tile-amber)" />
        <span>{t('panel.fortune')}</span>
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="fortune-popover"
          style={{ top: pos.top, left: pos.left }}
        >
          {/* Western fortune */}
          <div className="fortune-header">{t('fortune.western')}</div>
          <div className="fortune-line">"{western.line}"</div>
          <div className="fortune-meta">
            <span className="fortune-meta-item">
              <span className="fortune-meta-label">Mood</span>
              {western.mood}
            </span>
            <span className="fortune-meta-item">
              <span className="fortune-meta-label">Focus</span>
              {western.focus}
            </span>
            <span className="fortune-meta-item">
              <span className="fortune-meta-label">Lucky</span>
              {western.luckyColor} · {western.luckyNumber}
            </span>
          </div>

          <hr className="fortune-divider" />

          {/* Chinese fortune */}
          <div className="fortune-header">
            {t('fortune.cnHeader')}
            {lunar && (
              <span style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none', fontSize: 10 }}>
                {cn.ganzhi}{t('fortune.year')} {lunar.monthName}{lunar.dayName}
              </span>
            )}
            {term && (
              <span style={{ marginLeft: 6, color: 'var(--tile-amber)', fontWeight: 400, textTransform: 'none', fontSize: 10 }}>
                {term}
              </span>
            )}
          </div>
          <div className="fortune-line" style={{ fontSize: 12 }}>{cn.summary}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--tile-emerald)', fontWeight: 700, marginBottom: 4 }}>
                {t('fortune.yi')}
              </div>
              <div className="fortune-tags">
                {cn.yi.map((y) => (
                  <span
                    key={y}
                    className="fortune-tag"
                    style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--tile-emerald)' }}
                  >
                    {y}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--tile-coral)', fontWeight: 700, marginBottom: 4 }}>
                {t('fortune.ji')}
              </div>
              <div className="fortune-tags">
                {cn.ji.map((j) => (
                  <span
                    key={j}
                    className="fortune-tag"
                    style={{ background: 'rgba(255,90,78,0.15)', color: 'var(--tile-coral)' }}
                  >
                    {j}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--muted)' }}>
            {cn.zodiac}年 · {cn.ganzhi}
          </div>
        </div>
      )}
    </>
  );
}
