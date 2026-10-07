import { Head, Link, usePage } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import NovoLayout from '~/novo/NovoLayout'
import { askStream, type AskMessage, type AskSource } from '~/novo/askStream'
import { CONTINUE_PROMPT, turnsFromMessages } from '~/novo/conversation'

interface FichaHint {
  slug: string
  title: string
  summary: string
}

interface Turn {
  question: string
  /** Miniaturas das imagens anexadas (só na conversa em andamento). */
  images: string[]
  fichas: FichaHint[]
  answer: string
  thinking: string
  sources: AskSource[]
  error: string | null
  done: boolean
  /** A resposta parou no limite de tamanho: dá para pedir que continue. */
  truncated: boolean
}

interface SessionSummary {
  id: number
  title: string
  timestamp: string
}

interface Props {
  q: string
  model: string | null
  capabilities: { thinking: boolean; vision: 'supported' | 'unsupported' | 'unknown' } | null
  autoThinking: boolean
  collections: string[]
  sessions: SessionSummary[]
  session: { id: number; title: string; messages: { role: string; content: string; sources: AskSource[] }[] } | null
}

const MAX_IMAGES = 4

// Sugestões para começar. Ficam em português: são perguntas, não interface.
const SUGGESTIONS = [
  'Como deixar a água boa para beber?',
  'O que fazer numa queimadura?',
  'Qual rádio posso usar sem licença?',
  'Quanto paracetamol posso dar para uma criança?',
]

/** Perguntar à IA local, com resposta baseada no acervo do servidor e conversas guardadas. */
export default function NovoPerguntar(props: Props) {
  // Uma conversa reaberta começa do zero: o estado não passa de uma para outra.
  return <Conversation key={props.session?.id ?? 'nova'} {...props} />
}

function Conversation(props: Props) {
  const { t, i18n } = useTranslation()
  const { aiAssistantName } = usePage<{ aiAssistantName: string }>().props
  const assistant = t(aiAssistantName)
  const [input, setInput] = useState(props.q)
  const [turns, setTurns] = useState<Turn[]>(() =>
    props.session
      ? turnsFromMessages(props.session.messages).map((turn) => ({
          ...turn,
          images: [],
          fichas: [],
          thinking: '',
          error: null,
          done: true,
          truncated: false,
        }))
      : []
  )
  const [sessionId, setSessionId] = useState<number | null>(props.session?.id ?? null)
  const [sessions, setSessions] = useState<SessionSummary[]>(props.sessions)
  const [busy, setBusy] = useState(false)
  const [think, setThink] = useState(props.autoThinking)
  const [where, setWhere] = useState<string>('all')
  const [images, setImages] = useState<File[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const askedInitial = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const canThink = props.capabilities?.thinking === true
  const canSee = props.capabilities?.vision === 'supported'

  const update = (index: number, patch: (turn: Turn) => Partial<Turn>) =>
    setTurns((prev) => prev.map((turn, i) => (i === index ? { ...turn, ...patch(turn) } : turn)))

  const refreshSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions')
      if (!res.ok) return
      const list = (await res.json()) as { id: string; title: string; timestamp: string }[]
      setSessions(list.map((s) => ({ id: Number(s.id), title: s.title, timestamp: s.timestamp })))
    } catch {
      // a lista volta na próxima visita
    }
  }

  /** A conversa é guardada a partir da primeira pergunta. */
  const ensureSession = async (firstQuestion: string): Promise<number | undefined> => {
    if (sessionId) return sessionId
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: firstQuestion.slice(0, 60), model: props.model }),
      })
      if (!res.ok) return undefined
      const created = (await res.json()) as { id: string; title: string; timestamp: string }
      const id = Number(created.id)
      setSessionId(id)
      setSessions((prev) => [{ id, title: created.title, timestamp: created.timestamp }, ...prev])
      window.history.replaceState(window.history.state, '', `/perguntar/${id}`)
      return id
    } catch {
      return undefined // sem guardar, a conversa continua funcionando
    }
  }

  const history = (list: Turn[]): AskMessage[] =>
    list.flatMap((turn) =>
      turn.done && !turn.error && turn.answer
        ? [
            { role: 'user' as const, content: turn.question },
            { role: 'assistant' as const, content: turn.answer },
          ]
        : []
    )

  const run = async (index: number, messages: AskMessage[], attached: File[]) => {
    const id = await ensureSession(messages[messages.length - 1].content)
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    try {
      await askStream({
        model: props.model!,
        messages,
        signal: controller.signal,
        sessionId: id,
        think: canThink ? think : undefined,
        useKnowledgeBase: where !== 'none',
        collection: where.startsWith('c:') ? where.slice(2) : null,
        images: attached,
        onText: (chunk) => update(index, (turn) => ({ answer: turn.answer + chunk })),
        onThinking: (chunk) => update(index, (turn) => ({ thinking: turn.thinking + chunk })),
        onSources: (sources) => update(index, () => ({ sources })),
        onDone: (reason) => update(index, () => ({ truncated: reason === 'length' })),
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
      // O título da conversa é criado pela IA logo depois da primeira resposta.
      void refreshSessions()
      setTimeout(() => void refreshSessions(), 5000)
    }
  }

  const ask = async (question: string) => {
    const text = question.trim()
    if (!text || busy || !props.model) return
    const index = turns.length
    const attached = images
    setTurns((prev) => [
      ...prev,
      {
        question: text,
        images: attached.map((file) => URL.createObjectURL(file)),
        fichas: [],
        answer: '',
        thinking: '',
        sources: [],
        error: null,
        done: false,
        truncated: false,
      },
    ])
    setInput('')
    setImages([])

    fetch(`/fichas-sugeridas?q=${encodeURIComponent(text)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((fichas: FichaHint[]) => update(index, () => ({ fichas })))
      .catch(() => {})

    await run(index, [...history(turns), { role: 'user', content: text }], attached)
  }

  /** Pede para continuar a última resposta, que parou no limite de tamanho. */
  const continueAnswer = async () => {
    const index = turns.length - 1
    if (busy || index < 0) return
    update(index, () => ({ done: false, truncated: false }))
    await run(index, [...history(turns), { role: 'user', content: CONTINUE_PROMPT }], [])
  }

  const newConversation = () => {
    abortRef.current?.abort()
    setTurns([])
    setSessionId(null)
    setInput('')
    setImages([])
    window.history.replaceState(window.history.state, '', '/perguntar')
  }

  const removeSession = async (id: number) => {
    await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' }).catch(() => {})
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (id === sessionId) newConversation()
  }

  const removeAll = async () => {
    await fetch('/api/chat/sessions/all', { method: 'DELETE' }).catch(() => {})
    setSessions([])
    newConversation()
  }

  // Vindo da busca ("Não achou? Pergunte à IA"), a pergunta já é feita.
  useEffect(() => {
    if (props.q && props.model && !props.session && !askedInitial.current) {
      askedInitial.current = true
      void ask(props.q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addImages = (files: FileList | null) => {
    if (!files) return
    setImages((prev) => [...prev, ...Array.from(files)].slice(0, MAX_IMAGES))
    if (fileRef.current) fileRef.current.value = ''
  }

  const date = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

  return (
    <NovoLayout>
      <Head title={props.session?.title || t('Ask the AI')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div className="nv-chat-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="nv-title">{t('Ask {{name}}', { name: assistant })}</h1>
          <p className="nv-text">{t('It answers using the content on this server, without internet.')}</p>
        </div>
        {turns.length > 0 && (
          <button type="button" className="nv-chip" onClick={newConversation}>
            {t('New conversation')}
          </button>
        )}
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
          {sessions.length > 0 && <Sessions sessions={sessions} current={sessionId} date={date} onRemove={removeSession} onRemoveAll={removeAll} />}

          {turns.length === 0 && (
            <section className="nv-book">
              <h2 className="nv-section-label">{t('Try asking')}</h2>
              <div className="nv-chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="nv-chip" onClick={() => void ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="nv-conversation" aria-live="polite">
            {turns.map((turn, i) => (
              <div key={i} className="nv-turn">
                <div className="nv-question">
                  {turn.question}
                  {turn.images.length > 0 && (
                    <span className="nv-question-images">
                      {turn.images.map((src) => (
                        <img key={src} src={src} alt="" />
                      ))}
                    </span>
                  )}
                </div>

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
                  {turn.thinking && (
                    <details className="nv-thinking">
                      <summary>{turn.answer || turn.done ? t('How the AI reasoned') : t('The AI is reasoning…')}</summary>
                      <div className="nv-thinking-text">{turn.thinking}</div>
                    </details>
                  )}
                  {turn.answer ? (
                    <div className={`nv-article nv-answer-text${turn.done ? '' : ' nv-answer-writing'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.answer}</ReactMarkdown>
                    </div>
                  ) : !turn.done ? (
                    <Waiting />
                  ) : null}
                  {turn.error && <span className="nv-answer-error">{turn.error}</span>}
                  {turn.done && !turn.error && !turn.answer && <span className="nv-text">{t('Stopped.')}</span>}
                  {turn.truncated && i === turns.length - 1 && (
                    <div className="nv-answer-cut">
                      <span className="nv-text">{t('The answer reached the length limit and was cut off.')}</span>
                      <button type="button" className="nv-chip" disabled={busy} onClick={() => void continueAnswer()}>
                        {t('Continue')}
                      </button>
                    </div>
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

            {images.length > 0 && (
              <div className="nv-attached">
                {images.map((file, i) => (
                  <span key={`${file.name}-${i}`} className="nv-chip nv-attached-item">
                    {file.name}
                    <button type="button" className="nv-link-button" aria-label={t('Remove {{name}}', { name: file.name })} onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="nv-ask-options">
              <label className="nv-ask-option">
                <span>{t('Look in')}</span>
                <select className="nv-select" value={where} onChange={(e) => setWhere(e.target.value)} disabled={busy}>
                  <option value="all">{t('All content on this server')}</option>
                  {props.collections.map((c) => (
                    <option key={c} value={`c:${c}`}>
                      {t('Only in: {{name}}', { name: c })}
                    </option>
                  ))}
                  <option value="none">{t('Do not look (only what the AI knows)')}</option>
                </select>
              </label>
              {canThink && (
                <label className="nv-ask-option">
                  <input type="checkbox" checked={think} onChange={(e) => setThink(e.target.checked)} disabled={busy} />
                  <span>{t('Think before answering (slower)')}</span>
                </label>
              )}
              {canSee && (
                <>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addImages(e.target.files)} />
                  <button type="button" className="nv-chip" disabled={busy || images.length >= MAX_IMAGES} onClick={() => fileRef.current?.click()}>
                    {t('Attach photo')}
                  </button>
                </>
              )}
            </div>

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

/** Conversas guardadas, da mais recente para a mais antiga. */
function Sessions(props: {
  sessions: SessionSummary[]
  current: number | null
  date: (iso: string) => string
  onRemove: (id: number) => Promise<void>
  onRemoveAll: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState<number | 'all' | null>(null)
  return (
    <details className="nv-card nv-sessions">
      <summary className="nv-tile-label">{t('Previous conversations ({{count}})', { count: props.sessions.length })}</summary>
      <ul className="nv-sessions-list">
        {props.sessions.map((s) => (
          <li key={s.id} className={s.id === props.current ? 'nv-session nv-session-current' : 'nv-session'}>
            {confirming === s.id ? (
              <span className="nv-content-actions">
                <span className="nv-text">{t('Delete “{{title}}”?', { title: s.title })}</span>
                <button type="button" className="nv-link-button nv-danger-text" onClick={() => void props.onRemove(s.id).then(() => setConfirming(null))}>
                  {t('Yes, delete')}
                </button>
                <button type="button" className="nv-link-button" onClick={() => setConfirming(null)}>
                  {t('Cancel')}
                </button>
              </span>
            ) : (
              <>
                <a href={`/perguntar/${s.id}`} className="nv-session-link">
                  <span className="nv-session-title">{s.title}</span>
                  <span className="nv-session-date">{props.date(s.timestamp)}</span>
                </a>
                <button type="button" className="nv-link-button" aria-label={t('Delete “{{title}}”', { title: s.title })} onClick={() => setConfirming(s.id)}>
                  {t('Delete')}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {confirming === 'all' ? (
        <span className="nv-content-actions">
          <span className="nv-text">{t('Delete all conversations? This cannot be undone.')}</span>
          <button type="button" className="nv-link-button nv-danger-text" onClick={() => void props.onRemoveAll().then(() => setConfirming(null))}>
            {t('Yes, delete all')}
          </button>
          <button type="button" className="nv-link-button" onClick={() => setConfirming(null)}>
            {t('Cancel')}
          </button>
        </span>
      ) : (
        <button type="button" className="nv-link-button" onClick={() => setConfirming('all')}>
          {t('Delete all conversations')}
        </button>
      )}
    </details>
  )
}

/**
 * Espera até a primeira palavra da resposta: pontos que pulsam, o que está
 * acontecendo e há quanto tempo. Num computador sem placa de vídeo a IA pode
 * levar minutos, e uma tela parada parece travada.
 */
function Waiting() {
  const { t } = useTranslation()
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])
  const message =
    seconds < 6
      ? t('Looking in the sources on this server…')
      : seconds < 30
        ? t('Preparing the answer…')
        : t('Still working. Without a graphics card, the AI can take a few minutes.')
  return (
    <div className="nv-waiting" role="status">
      <span className="nv-waiting-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="nv-text">{message}</span>
      {seconds >= 3 && <span className="nv-waiting-time">{t('{{seconds}} s', { seconds })}</span>}
    </div>
  )
}
