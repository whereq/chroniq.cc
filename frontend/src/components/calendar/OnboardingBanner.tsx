import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { meApi } from '@/api/client'

/**
 * Shown at the top of the calendar workspace until the user has finished the
 * minimum setup needed for their booking page to work: a username, at least one
 * availability schedule, and at least one event type. Disappears once ready.
 */
export function OnboardingBanner() {
  const { t } = useTranslation()

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: meApi.getProfile })
  const { data: eventTypes } = useQuery({ queryKey: ['event-types'], queryFn: meApi.listEventTypes })
  const { data: availability } = useQuery({ queryKey: ['availability'], queryFn: meApi.listSchedules })

  // Wait until all three have loaded to avoid a flash of the banner.
  if (!profile || !eventTypes || !availability) return null

  const needsUsername = !profile.username
  const needsAvailability = availability.length === 0
  const needsEventType = eventTypes.length === 0
  if (!needsUsername && !needsAvailability && !needsEventType) return null

  const steps: string[] = []
  if (needsUsername) steps.push(t('onboarding.step_username'))
  if (needsAvailability) steps.push(t('onboarding.step_availability'))
  if (needsEventType) steps.push(t('onboarding.step_event_type'))

  return (
    <div className="onboarding-banner">
      <div className="onboarding-banner-text">
        <strong>{t('onboarding.title')}</strong>
        <span>{steps.join(' · ')}</span>
      </div>
      <a href="/dashboard" className="onboarding-banner-cta">
        {t('onboarding.cta')}
      </a>
    </div>
  )
}
