import { Head, Link, usePage } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import NovoLayout from '~/novo/NovoLayout'
import { askStream, type AskMessage, type AskSource } from '~/novo/askStream'

interface FichaHint {
  slug: string
  title: string
  summary: string
}

interface Turn {
  question: string
  fichas: FichaHint[]
  answer: string
  sources: AskSource[]
  error: string | null
  done: boolean
}

/** Perguntar à IA local, com resposta baseada no acervo do servidor. */
export default function NovoPerguntar(props: { q: string; model: string | null }) {
  const { t } = useTranslation()
  const { aiAssistantName } = usePage<{ aiAssistantName: string }>().props
  const assistant = t(aiAssistantName)
  const [input, setInput] = useState(props.q)
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const askedInitial = useRef(false)

  const update = (index: number, patch: (turn: Turn) => Partial<Turn>) =>
    setTurns((prev) => prev.map((turn, i) => (i === index ? { ...turn, ...patch(turn) } : turn)))

  const ask = async (question: string) => {
    const text = question.trim()
    if (!text || busy || !props.model) return
    const index = turns.length
    // Histórico só com o que foi respondido, para a IA entender o contexto.
    const history: AskMessage[] = turns.flatMap((turn) =>
      turn.done && !turn.error
        ? [
            { role: 'user' as const, content: turn.question },
            { role: 'assistant' as const, content: turn.answer },
          ]
        : []
    )
    setTurns((prev) => [...prev, { question: text, fichas: [], answer: '', sources: [], error: null, done: false }])
    setInput('')
    setBusy(true)

    fetch(`/fichas-sugeridas?q=${encodeURIComponent(text)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((fichas: FichaHint[]) => update(index, () => ({ fichas })))
      .catch(() => {})

    const controller = new AbortController()
    abortRef.current = controller
    try {
      await askStream({
        model: props.model,
        messages: [...history, { role: 'user', content: text }],
        signal: controller.signal,
        onText: (chunk) => update(index, (turn) => ({ answer: turn.answer + chunk })),
        onSources: (sources) => update(index, () => ({ sources })),
      })
      update(index, () => ({ done: true }))
    } catch (err) {
      const stopped = controller.signal.aborted
      update(index, () => ({
        done: true,
        error: stopped ? null : (err as Error).message || t('The AI could not answer. Try again.'),
      }))
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  }

  // Vindo da busca ("Não achou? Pergunte à IA"), a pergunta já é feita.
  useEffect(() => {
    if (props.q && props.model && !askedInitial.current) {
      askedInitial.current = true
      void ask(props.q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <NovoLayout>
      <Head title={t('Ask the AI')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Ask {{name}}', { name: assistant })}</h1>
        <p className="nv-text">{t('It answers using the content on this server, without internet.')}</p>
      </div>

      {!props.model ? (
        <div className="nv-card">
          <span className="nv-tile-label">{t('The AI is not available on this server')}</span>
          <span className="nv-text">
            {t('Whoever manages the server can install the AI assistant and a model in the classic interface.')}
          </span>
        </div>
      ) : (
        <>
          <div className="nv-conversation" aria-live="polite">
            {turns.map((turn, i) => (
              <div key={i} className="nv-turn">
                <div className="nv-question">{turn.question}</div>

                {turn.fichas.length > 0 && (
                  <div className="nv-turn-fichas">
                    <span className="nv-section-label">{t('First aid · do it now')}</span>
                    {turn.fichas.map((ficha) => (
                      <Link key={ficha.slug} href={`/fichas/${ficha.slug}`} className="nv-card nv-card-link nv-card-ficha">
                        <span className="nv-tile-label">{ficha.title}</span>
                        <span className="nv-text">{ficha.summary}</span>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="nv-card nv-answer">
                  {turn.answer ? (
                    <div className="nv-article nv-answer-text">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.answer}</ReactMarkdown>
                    </div>
                  ) : !turn.done ? (
                    <span className="nv-text">{t('Thinking…')}</span>
                  ) : null}
                  {turn.error && <span className="nv-answer-error">{turn.error}</span>}
                  {turn.done && !turn.error && !turn.answer && (
                    <span className="nv-text">{t('Stopped.')}</span>
                  )}
                  {turn.sources.length > 0 && (
                    <div className="nv-answer-sources">
                      <span className="nv-section-label">{t('Based on')}</span>
                      <ul>
                        {turn.sources.map((source, j) => (
                          <li key={j}>
                            {source.href ? (
                              <a href={source.href} target="_blank" rel="noopener" className="nv-answer-source-link">
                                {source.title}
                              </a>
                            ) : (
                              source.title
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            className="nv-search"
            onSubmit={(e) => {
              e.preventDefault()
              void ask(input)
            }}
          >
            <label htmlFor="nv-pergunta" className="nv-section-label">
              {turns.length > 0 ? t('Another question') : t('Your question')}
            </label>
            <textarea
              id="nv-pergunta"
              className="nv-input nv-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void ask(input)
                }
              }}
              placeholder={t('E.g.: how do I make water safe to drink?')}
              rows={2}
              disabled={busy}
            />
            {busy ? (
              <button type="button" className="nv-primary nv-secondary" onClick={() => abortRef.current?.abort()}>
                {t('Stop')}
              </button>
            ) : (
              <button type="submit" className="nv-primary" disabled={!input.trim()}>
                {t('Ask')}
              </button>
            )}
          </form>

          <p className="nv-text nv-ai-warning">
            {t('AI answers can be wrong. In an emergency, follow the first aid cards and call 192.')}
          </p>
        </>
      )}
    </NovoLayout>
  )
}
