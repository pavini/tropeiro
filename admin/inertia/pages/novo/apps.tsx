import { Head, Link, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { appInfo, appState, groupApps, GROUP_LABEL, type AppState, type NovoApp } from '~/novo/apps'
import { getServiceLink } from '~/lib/navigation'
import useInternetStatus from '~/hooks/useInternetStatus'

type Action = 'install' | 'start' | 'stop' | 'restart'

const STATE_LABEL: Record<AppState, string> = {
  running: 'Working',
  starting: 'Starting…',
  stopped: 'Stopped',
  installing: 'Installing…',
  failed: 'Installation failed',
  available: 'Not installed',
}

const RESULT: Record<string, { title: string; text?: string; error?: boolean }> = {
  install: { title: 'Installation started', text: 'It may take a few minutes. This page shows when it is ready.' },
  start: { title: 'App started' },
  stop: { title: 'App stopped' },
  restart: { title: 'App restarted' },
  erro: { title: 'Could not do that', text: 'Try again. If it keeps failing, see the details in the advanced administration.', error: true },
}

/** Apps do servidor: o que cada um faz, se está funcionando, e instalar, abrir, iniciar ou parar. */
export default function NovoApps(props: { apps: NovoApp[]; result: string }) {
  const { t } = useTranslation()
  const { isOnline } = useInternetStatus()
  const [sending, setSending] = useState<string | null>(null)
  const [confirmStop, setConfirmStop] = useState<string | null>(null)

  const onServer = props.apps.filter((a) => ['running', 'starting', 'stopped', 'installing'].includes(appState(a)))
  const toInstall = props.apps.filter((a) => ['available', 'failed'].includes(appState(a)))
  const busy = props.apps.some((a) => ['installing', 'starting'].includes(appState(a)))

  // Instalação e partida acontecem em segundo plano: atualiza até terminar.
  useEffect(() => {
    if (!busy) return
    const timer = setInterval(() => router.reload({ only: ['apps'] }), 3000)
    return () => clearInterval(timer)
  }, [busy])

  const act = (app: NovoApp, action: Action) => {
    setSending(`${app.name}:${action}`)
    router.post(
      '/apps',
      { service: app.name, action },
      {
        onFinish: () => {
          setSending(null)
          setConfirmStop(null)
        },
      }
    )
  }

  // "Instalação iniciada" some quando termina: daí em diante o próprio app mostra o estado.
  const installing = props.apps.some((a) => appState(a) === 'installing')
  const result = props.result === 'install' && !installing ? undefined : RESULT[props.result]
  const title = (app: NovoApp) => {
    const info = appInfo(app)
    return info.translated ? t(info.title) : info.title
  }

  const renderApp = (app: NovoApp) => {
    const info = appInfo(app)
    const state = appState(app)
    const name = title(app)
    const what = info.what && (info.translated ? t(info.what) : info.what)
    const disabled = sending !== null
    const external = !info.href && app.uiLocation ? getServiceLink(app.uiLocation, app.customUrl) : null

    return (
      <li key={app.name} className="nv-card nv-app">
        <span className="nv-app-head">
          <span className="nv-tile-label">{name}</span>
          <span className={`nv-app-state nv-app-${state}`}>{t(STATE_LABEL[state])}</span>
        </span>
        {what && <span className="nv-text">{what}</span>}

        {confirmStop === app.name ? (
          <div className="nv-content-confirm" role="alert">
            <span className="nv-text">
              <strong>{t('Stop {{name}}?', { name })}</strong>{' '}
              {t('Whoever is using it loses access until it is started again.')}
            </span>
            <span className="nv-content-actions">
              <button type="button" className="nv-primary nv-danger" disabled={disabled} onClick={() => act(app, 'stop')}>
                {t('Yes, stop')}
              </button>
              <button type="button" className="nv-primary nv-secondary" disabled={disabled} onClick={() => setConfirmStop(null)}>
                {t('Cancel')}
              </button>
            </span>
          </div>
        ) : (
          <span className="nv-content-actions">
            {state === 'running' && info.href && (
              <Link href={info.href} className="nv-primary nv-app-button">
                {t('Open')}
              </Link>
            )}
            {state === 'running' && external && (
              <a href={external} target="_blank" rel="noreferrer" className="nv-primary nv-app-button">
                {t('Open')}
              </a>
            )}
            {state === 'stopped' && (
              <button type="button" className="nv-primary nv-app-button" disabled={disabled} onClick={() => act(app, 'start')}>
                {sending === `${app.name}:start` ? t('Starting…') : t('Start')}
              </button>
            )}
            {state === 'running' && (
              <>
                <button type="button" className="nv-primary nv-secondary nv-app-button" disabled={disabled} onClick={() => act(app, 'restart')}>
                  {sending === `${app.name}:restart` ? t('Restarting…') : t('Restart')}
                </button>
                <button type="button" className="nv-link-button" disabled={disabled} onClick={() => setConfirmStop(app.name)}>
                  {t('Stop')}
                </button>
              </>
            )}
            {state === 'installing' && <span className="nv-text">{t('It may take a few minutes.')}</span>}
            {(state === 'available' || state === 'failed') &&
              (isOnline ? (
                <button type="button" className="nv-primary nv-secondary nv-app-button" disabled={disabled} onClick={() => act(app, 'install')}>
                  {sending === `${app.name}:install` ? t('Installing…') : state === 'failed' ? t('Try again') : t('Install')}
                </button>
              ) : (
                <span className="nv-text">{t('Installing needs internet.')}</span>
              ))}
          </span>
        )}
      </li>
    )
  }

  return (
    <NovoLayout>
      <Head title={t('Apps')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Apps')}</h1>
        <p className="nv-text">{t('Programs that run on this server and work without internet.')}</p>
      </div>

      {result && (
        <div className={`nv-card ${result.error ? 'nv-card-error' : 'nv-card-ok'}`} role={result.error ? 'alert' : 'status'}>
          <span className="nv-tile-label">{t(result.title)}</span>
          {result.text && <span className="nv-text">{t(result.text)}</span>}
        </div>
      )}

      <section className="nv-content-group">
        <h2 className="nv-section-label">{t('On this server')}</h2>
        {onServer.length === 0 ? (
          <p className="nv-text">{t('No apps installed yet.')}</p>
        ) : (
          <ul className="nv-content-list">{groupApps(onServer).flatMap((g) => g.apps.map(renderApp))}</ul>
        )}
      </section>

      {groupApps(toInstall).map(({ group, apps }) => (
        <section key={group} className="nv-content-group">
          <h2 className="nv-section-label">
            {t('To install')} · {t(GROUP_LABEL[group])}
          </h2>
          <ul className="nv-content-list">{apps.map(renderApp)}</ul>
        </section>
      ))}

      <a href="/supply-depot" className="nv-card nv-card-link">
        <span className="nv-tile-label">{t('Remove, update or add your own apps')}</span>
        <span className="nv-text">{t('This is done in the advanced administration.')}</span>
      </a>
    </NovoLayout>
  )
}
