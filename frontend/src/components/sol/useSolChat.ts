import { useCallback, useRef, useState } from 'react'
import keycloak from '@/auth/keycloak'

export interface SolMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * SOL chat hook — streams the assistant's reply over SSE (fetch + ReadableStream).
 * Stateless per session for Phase 1 (history lives in component state).
 */
export function useSolChat() {
  const [messages, setMessages] = useState<SolMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [working, setWorking] = useState(false) // tools running
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setStreaming(false)
    setWorking(false)
  }, [])

  const setLastAssistant = useCallback((content: string) => {
    setMessages((prev) => {
      const next = [...prev]
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === 'assistant') {
          next[i] = { ...next[i], content }
          break
        }
      }
      return next
    })
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming) return
      setError(null)
      const history: SolMessage[] = [...messages, { role: 'user', content: trimmed }]
      setMessages([...history, { role: 'assistant', content: '' }])
      setStreaming(true)

      try {
        if (keycloak.authenticated) {
          try {
            await keycloak.updateToken(30)
          } catch {
            /* keep going; a 401 will surface below */
          }
        }
        const ctrl = new AbortController()
        abortRef.current = ctrl
        const locale = localStorage.getItem('chroniq-cc-lang') || undefined

        const res = await fetch('/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {}),
          },
          body: JSON.stringify({ messages: history, locale }),
          signal: ctrl.signal,
        })
        if (res.status === 402 || res.status === 403) {
          setError('upgrade')
          setLastAssistant('')
          return
        }
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let assistant = ''

        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''
          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith('data:')) continue
            const data = line.slice(5).trim()
            if (data === '[DONE]') continue
            try {
              const chunk = JSON.parse(data)
              if (chunk.delta) {
                assistant += chunk.delta
                setWorking(false)
                setLastAssistant(assistant)
              } else if (chunk.clear_content) {
                assistant = ''
                setWorking(true)
                setLastAssistant('')
              } else if (chunk.status === 'working') {
                setWorking(true)
              } else if (chunk.error_code) {
                setError(chunk.error_code)
              }
            } catch {
              /* ignore malformed SSE fragment */
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('transient')
      } finally {
        setStreaming(false)
        setWorking(false)
        abortRef.current = null
      }
    },
    [messages, streaming, setLastAssistant],
  )

  return { messages, streaming, working, error, send, reset }
}
