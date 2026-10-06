import { Head, Link, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { aiNotices, aiWhere, normalizeAiUrl, referencesNotice, splitModels, type AiNotice } from '~/novo/ai'

interface Props {
  remote: { url: string; reachable: boolean } | null
  local: { installed: boolean; running: boolean }
  models: string[]
  model: string | null
  embedding: boolean
  embeddingModel: string
  references: { total: number; ready: number; failed: number } | null
  result: string
}

type TestResult = { ok: true; models: string[] } | { ok: false }

const RESULT: Record<string, { title: string; text?: string; error?: boolean }> = {
  endereco: { title: 'Now using the AI at the new address' },
  local: { title: 'Back to the AI on this server' },
  modelo: { title: 'Model saved', text: 'The questions screen now uses it.' },
  'sem-resposta': {
    title: 'That address did not respond',
    text: 'Nothing was changed. Check the address and test the connection.',
    error: true,
  },
  erro: { title: 'Could not do that', text: 'Try again. If it keeps failing, see the details in the advanced administration.', error: true },
}

const ICON: Record<AiNotice['level'], string> = {
  ok: 'M5 12 L10 17 L19 7',
  info: 'M12 8 V8.01 M12 11 V16',
  warn: 'M12 7 V13 M12 16.5 V16.51',
  error: 'M7 7 L17 17 M17 7 L7 17',
}

/** Inteligência artificial: onde ela roda, qual modelo responde e os documentos que ela lê. */
export default function NovoIa(props: Props) {
  const { t } = useTranslation()
  const where = aiWhere(props)
  const [address, setAddress] = useState(props.remote?.url ?? '')
  const [testing, setTesting] = useState(false)
  const [test, setTest] = useState<{ url: string; result: TestResult } | null>(null)
  const [sending, setSending] = useState<string | null>(null)

  const url = normalizeAiUrl(address)
  const notices = aiNotices(props)
  const references = referencesNotice(props.references)
  const result = RESULT[props.result]
  const testResult = test && test.url === url ? test.result : null

  // Enquanto a IA lê os documentos oficiais, acompanha o andamento.
  const reading = !!props.references && props.references.failed === 0 && props.references.ready < props.references.total
  useEffect(() => {
    if (!reading) return
    const timer = setInterval(() => router.reload({ only: ['references'] }), 15000)
    return () => clearInterval(timer)
  }, [reading])

  const post = (path: string, data: Record<string, string>, key: string) => {
    setSending(key)
    router.post(path, data, { preserveScroll: true, onFinish: () => setSending(null) })
  }

  const testConnection = async () => {
    if (!url) return
    setTesting(true)
    try {
      const res = await fetch(`/ia/testar?url=${encodeURIComponent(url)}`, { headers: { Accept: 'application/json' } })
      const body = res.ok ? await res.json() : null
      setTest({ url, result: body?.ok ? { ok: true, models: body.models ?? [] } : { ok: false } })
    } catch {
      setTest({ url, result: { ok: false } })
    } finally {
      setTesting(false)
    }
  }

  const busy = sending !== null
  const sameAsCurrent = !!props.remote && url === normalizeAiUrl(props.remote.url)

  return (
    <NovoLayout>
      <Head title={t('Artificial intelligence')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Artificial intelligence')}</h1>
        <p className="nv-text">{t('The AI answers questions using the content of this server.')}</p>
      </div>

      {result && (
        <div className={`nv-card ${result.error ? 'nv-card-error' : 'nv-card-ok'}`} role={result.error ? 'alert' : 'status'}>
          <span className="nv-tile-label">{t(result.title)}</span>
          {result.text && <span className="nv-text">{t(result.text)}</span>}
        </div>
      )}

      {notices.length > 0 && (
        <ul className="nv-health-list">
          {notices.map((n) => (
            <NoticeRow key={n.id} notice={n} />
          ))}
        </ul>
      )}

      <section className="nv-content-group">
        <h2 className="nv-section-label">{t('Where the AI runs')}</h2>

        <div className={`nv-card nv-ia-option ${where !== 'remote' ? 'nv-ia-current' : ''}`}>
          <span className="nv-app-head">
            <span className="nv-tile-label">{t('On this server')}</span>
            {where !== 'remote' && <span className="nv-app-state nv-app-running">{t('In use')}</span>}
          </span>
          <span className="nv-text">
            {!props.local.installed
              ? t('Not installed. It is installed in the apps screen.')
              : props.local.running
                ? t('Installed and working.')
                : t('Installed, but stopped.')}
          </span>
          <span className="nv-content-actions">
            {where === 'remote' && (
              <button type="button" className="nv-primary nv-secondary nv-app-button" disabled={busy} onClick={() => post('/ia/endereco', { url: '' }, 'local')}>
                {sending === 'local' ? t('Switching…') : t('Use the AI on this server')}
              </button>
            )}
            {(where !== 'remote' || !props.local.installed) && (
              <Link href="/apps" className="nv-health-action">
                {t('Open the apps')} →
              </Link>
            )}
          </span>
        </div>

        <div className={`nv-card nv-ia-option ${where === 'remote' ? 'nv-ia-current' : ''}`}>
          <span className="nv-app-head">
            <span className="nv-tile-label">{t('At another address')}</span>
            {where === 'remote' && <span className="nv-app-state nv-app-running">{t('In use')}</span>}
          </span>
          <span className="nv-text">
            {t('Worth it when another computer on the network has a graphics card, or is a Mac with Ollama installed: it answers several times faster.')}
          </span>
          {props.remote && (
            <span className="nv-text">
              <strong>{props.remote.url}</strong> ·{' '}
              {props.remote.reachable ? t('Responding') : t('Not responding')}
            </span>
          )}
          <label className="nv-text" htmlFor="ia-endereco">
            {t('Address of the AI')}
          </label>
          <input
            id="ia-endereco"
            className="nv-input"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="http://192.168.0.20:11434"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {address.trim() !== '' && !url && <span className="nv-text">{t('This does not look like an address. Example: http://192.168.0.20:11434')}</span>}
          <span className="nv-content-actions">
            <button type="button" className="nv-primary nv-secondary nv-app-button" disabled={!url || testing || busy} onClick={testConnection}>
              {testing ? t('Testing…') : t('Test connection')}
            </button>
            <button type="button" className="nv-primary nv-app-button" disabled={!url || busy || sameAsCurrent} onClick={() => url && post('/ia/endereco', { url }, 'remote')}>
              {sending === 'remote' ? t('Switching…') : t('Use this address')}
            </button>
          </span>
          {testResult && <TestResultCard result={testResult} embeddingModel={props.embeddingModel} />}
        </div>
      </section>

      <section className="nv-content-group">
        <h2 className="nv-section-label">{t('Model for the answers')}</h2>
        {props.models.length === 0 ? (
          <p className="nv-text">
            {where === 'none' || (props.remote && !props.remote.reachable)
              ? t('The models appear here when the AI is working.')
              : t('The AI in use has no model to answer with.')}
          </p>
        ) : (
          <ul className="nv-content-list">
            {props.models.map((m) => (
              <li key={m} className="nv-card nv-content-item">
                <span className="nv-content-head">
                  <span className="nv-tile-label">{m}</span>
                  {m === props.model ? (
                    <span className="nv-app-state nv-app-running">{t('In use')}</span>
                  ) : (
                    <button type="button" className="nv-primary nv-secondary nv-app-button nv-ia-pick" disabled={busy} onClick={() => post('/ia/modelo', { model: m }, `modelo:${m}`)}>
                      {sending === `modelo:${m}` ? t('Saving…') : t('Use this one')}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        {where === 'local' && (
          <a href="/settings/models" className="nv-card nv-card-link">
            <span className="nv-tile-label">{t('Download or remove models')}</span>
            <span className="nv-text">{t('This is done in the advanced administration.')}</span>
          </a>
        )}
      </section>

      <section className="nv-content-group">
        <h2 className="nv-section-label">{t('Official documents')}</h2>
        <ul className="nv-health-list">
          <NoticeRow notice={references} />
        </ul>
      </section>
    </NovoLayout>
  )
}

function TestResultCard({ result, embeddingModel }: { result: TestResult; embeddingModel: string }) {
  const { t } = useTranslation()
  if (!result.ok) {
    return (
      <div className="nv-card nv-card-error" role="alert">
        <span className="nv-tile-label">{t('No response from this address')}</span>
        <span className="nv-text">
          {t('On the other computer, Ollama must be open and accept connections from the network (OLLAMA_HOST=0.0.0.0).')}
        </span>
      </div>
    )
  }
  const { chat, embedding } = splitModels(result.models)
  return (
    <div className="nv-card nv-card-ok" role="status">
      <span className="nv-tile-label">{t('It responded')}</span>
      <span className="nv-text">
        {chat.length > 0 ? t('Models at this address: {{models}}', { models: chat.join(', ') }) : t('But it has no model to answer with yet.')}
      </span>
      {!embedding && (
        <span className="nv-text">
          {t('It is missing the model that reads the documents. On that computer, run: {{command}}', {
            command: `ollama pull ${embeddingModel}`,
          })}
        </span>
      )}
    </div>
  )
}

/** Telas da interface clássica: abrem com a página inteira, que tem outro layout. */
const CLASSIC = ['/home', '/settings', '/supply-depot', '/chat', '/maps']

function NoticeRow({ notice }: { notice: AiNotice }) {
  const { t } = useTranslation()
  const external = notice.action && CLASSIC.some((p) => notice.action!.href.startsWith(p))
  return (
    <li className={`nv-card nv-health-item nv-health-${notice.level}`}>
      <span className="nv-health-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICON[notice.level]} />
        </svg>
      </span>
      <span className="nv-health-body">
        <span className="nv-tile-label">{t(notice.title, notice.titleParams)}</span>
        {notice.detail && <span className="nv-text">{t(notice.detail, notice.detailParams)}</span>}
        {notice.action &&
          (external ? (
            <a className="nv-health-action" href={notice.action.href}>
              {t(notice.action.label)} →
            </a>
          ) : (
            <Link className="nv-health-action" href={notice.action.href}>
              {t(notice.action.label)} →
            </Link>
          ))}
      </span>
    </li>
  )
}
