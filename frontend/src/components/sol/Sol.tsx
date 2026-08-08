import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PiSunFill, PiPaperPlaneRightFill, PiX } from 'react-icons/pi'
import { useAuth } from '@/auth/AuthProvider'
import { useSolChat } from './useSolChat'

/**
 * SOL — chroniq's AI calendar assistant. A floating squared launcher (bottom-right,
 * app-wide for authed users) that opens a right-docked chat panel. Renders nothing
 * for anonymous visitors or when no LLM provider is configured.
 */
export function Sol() {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [input, setInput] = useState('')
  const { messages, streaming, working, error, send } = useSolChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    fetch('/api/v1/chat/available')
      .then((r) => r.json())
      .then((d) => setAvailable(!!d.available))
      .catch(() => setAvailable(false))
  }, [isAuthenticated])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, working])

  if (!isAuthenticated || available === false) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = input
    setInput('')
    send(v)
  }

  const examples = [
    t('sol.example_week', 'What does my week look like?'),
    t('sol.example_free', 'When am I free tomorrow?'),
    t('sol.example_bookings', 'List my upcoming bookings'),
    t('sol.example_types', 'What meeting types do I have?'),
  ]

  const errorText =
    error === 'upgrade' || error === 'quota_exhausted'
      ? t('sol.err_upgrade', 'Your SOL trial has ended — upgrade to Pro to keep chatting.')
      : error === 'auth_error'
        ? t('sol.err_auth', 'SOL is misconfigured. Please contact support.')
        : t('sol.err_generic', 'Something went wrong. Please try again.')

  return (
    <>
      {!open && (
        <button className="sol-launcher" onClick={() => setOpen(true)} title={t('sol.open', 'Ask SOL')}>
          <PiSunFill size={16} aria-hidden />
          <span>{t('sol.name', 'SOL')}</span>
        </button>
      )}

      {open && (
        <aside className="sol-panel" role="dialog" aria-label="SOL assistant">
          <header className="sol-header">
            <div className="sol-title">
              <PiSunFill size={15} aria-hidden />
              <span>{t('sol.name', 'SOL')}</span>
              <span className="sol-sub">{t('sol.tagline', 'calendar assistant')}</span>
            </div>
            <button className="btn-icon" onClick={() => setOpen(false)} title={t('sol.close', 'Close')}>
              <PiX size={16} />
            </button>
          </header>

          <div className="sol-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="sol-empty">
                <p className="sol-empty-hi">{t('sol.greeting', "Hi — I'm SOL. Ask me anything about your calendar.")}</p>
                <div className="sol-examples">
                  {examples.map((ex) => (
                    <button key={ex} className="sol-chip" onClick={() => send(ex)} disabled={streaming}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isLast = i === messages.length - 1
              const showWorking = m.role === 'assistant' && !m.content && working && isLast
              const showTyping = m.role === 'assistant' && !m.content && streaming && !working && isLast
              return (
                <div key={i} className={`sol-msg sol-${m.role}`}>
                  {m.content || (showWorking ? t('sol.working', 'Checking your calendar…') : showTyping ? '…' : '')}
                </div>
              )
            })}

            {error && (
              <div className="sol-error">
                {errorText}
                {(error === 'upgrade' || error === 'quota_exhausted') && (
                  <>
                    {' '}
                    <a href="/dashboard?tab=plan">{t('sol.upgrade_link', 'Upgrade')}</a>
                  </>
                )}
              </div>
            )}
          </div>

          <form className="sol-input" onSubmit={submit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('sol.placeholder', 'Ask about your calendar…')}
              disabled={streaming}
            />
            <button type="submit" className="btn-icon" disabled={streaming || !input.trim()} title={t('sol.send', 'Send')}>
              <PiPaperPlaneRightFill size={15} />
            </button>
          </form>
        </aside>
      )}
    </>
  )
}
