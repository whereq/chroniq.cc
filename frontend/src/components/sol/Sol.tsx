import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PiPaperPlaneRightFill, PiX } from 'react-icons/pi'
import { useAuth } from '@/auth/AuthProvider'
import { useSolChat } from './useSolChat'
import solAvatar from '@/assets/sol.png'

/**
 * Strip <think>…</think> reasoning from the visible text (matches NOVA). Handles
 * the mid-stream case where the opening tag has arrived but the closing one has
 * not yet — everything from an unclosed <think> onward stays hidden.
 */
function parseThinking(content: string): string {
  let visible = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
  const openIdx = visible.indexOf('<think>')
  if (openIdx !== -1) visible = visible.slice(0, openIdx)
  return visible.replace(/^\s+/, '')
}

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
          <img src={solAvatar} className="sol-launcher-avatar" alt="" aria-hidden />
          <span>{t('sol.name', 'SOL')}</span>
        </button>
      )}

      {open && (
        <aside className="sol-panel" role="dialog" aria-label="SOL assistant">
          <header className="sol-header">
            <div className="sol-title">
              <img src={solAvatar} className="sol-avatar-sm" alt="" aria-hidden />
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
              const isAssistant = m.role === 'assistant'
              const isLast = i === messages.length - 1
              const visible = isAssistant ? parseThinking(m.content) : m.content
              const showWorking = isAssistant && !visible && working && isLast
              const showTyping = isAssistant && !visible && streaming && !working && isLast
              const body = visible || (showWorking ? t('sol.working', 'Checking your calendar…') : showTyping ? '…' : '')
              if (!body && isAssistant && !isLast) return null
              return (
                <div key={i} className={`sol-row sol-row-${m.role}`}>
                  {isAssistant && <img src={solAvatar} className="sol-avatar" alt="SOL" />}
                  <div className={`sol-msg sol-${m.role}`}>{body}</div>
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
