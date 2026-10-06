import { Head, Link, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { healthChecks, overallLevel, stoppedServices, type HealthCheck, type HealthLevel } from '~/novo/serverHealth'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import { getPrimaryDiskInfo } from '~/hooks/useDiskDisplayData'
import useInternetStatus from '~/hooks/useInternetStatus'
import type { DownloadJobWithProgress } from '../../../types/downloads'

interface Props {
  services: { name: string; label: string; isCustom: boolean; status: string }[]
  library: { installed: boolean; reachable: boolean; books: number }
  ai: { installed: boolean; model: string | null; remote: { url: string; reachable: boolean } | null }
  references: {
    total: number
    available: number
    ai: { total: number; ready: number; failed: number } | null
  }
  content: {
    enabled: boolean
    source: 'downloaded' | 'bundled'
    updatedAt?: string
    lastCheckAt?: string
    lastResult?: string
    lastMessage?: string
  }
}

const ICON: Record<HealthLevel, string> = {
  ok: 'M5 12 L10 17 L19 7',
  info: 'M12 8 V8.01 M12 11 V16',
  warn: 'M12 7 V13 M12 16.5 V16.51',
  error: 'M7 7 L17 17 M17 7 L7 17',
}

/** Resultado de "Procurar atualização agora" (chega em ?conteudo=...); as chaves são de tradução. */
const CONTENT_RESULT: Record<string, { title: string; error?: boolean }> = {
  'atualizado': { title: 'New content applied' },
  'em-dia': { title: 'Content is already up to date' },
  'sem-internet': { title: 'No internet to check for new content', error: true },
  'erro': { title: 'Could not check for new content', error: true },
  'invalido': { title: 'New content had problems and was not used', error: true },
  'formato-novo': { title: 'There is new content, but the Tropeiro needs to be updated first', error: true },
  'desativado': { title: 'Content from the repository folder' },
}

/** Estado do servidor, em linguagem simples, para quem cuida dele. */
export default function NovoEstado(props: Props) {
  const { t } = useTranslation()
  const { isOnline } = useInternetStatus()
  const { data: systemInfo } = useSystemInfo({ enabled: true })
  const disk = getPrimaryDiskInfo(systemInfo?.disk, systemInfo?.fsSize)

  const { data: downloads } = useQuery({
    queryKey: ['novo-estado-downloads'],
    queryFn: async (): Promise<{ workerAlive: boolean | null; jobs: DownloadJobWithProgress[] }> => {
      const res = await fetch('/downloads', { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    refetchInterval: 10000,
  })

  // Enquanto a IA lê os documentos oficiais, acompanha o andamento.
  const checkedContent = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('conteudo')
  const ai = props.references.ai
  const aiReading = !!ai && ai.failed === 0 && ai.ready < ai.total
  useEffect(() => {
    if (!aiReading) return
    const timer = setInterval(() => router.reload({ only: ['references'] }), 15000)
    return () => clearInterval(timer)
  }, [aiReading])

  const tr = (name: string, isCustom: boolean) => (isCustom ? name : t(name))
  const checks = healthChecks({
    library: props.library,
    ai: props.ai,
    stoppedApps: stoppedServices(props.services, !!props.ai.remote).map((s) => tr(s.label, s.isCustom)),
    downloads: downloads
      ? {
          workerAlive: downloads.workerAlive,
          active: downloads.jobs.filter((j) => j.status !== 'failed').length,
          failed: downloads.jobs.filter((j) => j.status === 'failed').length,
        }
      : null,
    disk: disk ? { free: Math.max(0, disk.totalSize - disk.totalUsed), total: disk.totalSize } : null,
    references: props.references,
    content: props.content,
    online: isOnline,
  })
  const overall = overallLevel(checks)
  const problems = checks.filter((c) => c.level === 'warn' || c.level === 'error').length

  return (
    <NovoLayout>
      <Head title={t('Server status')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <h1 className="nv-title">{t('Server status')}</h1>

      {checkedContent && CONTENT_RESULT[checkedContent] && (
        <div className={`nv-card ${CONTENT_RESULT[checkedContent].error ? 'nv-card-error' : 'nv-card-ok'}`} role="status">
          <span className="nv-tile-label">{t(CONTENT_RESULT[checkedContent].title)}</span>
          {checkedContent === 'atualizado' && props.content.lastMessage && <span className="nv-text">{props.content.lastMessage}</span>}
        </div>
      )}

      <div className={`nv-card nv-health-summary nv-health-${overall}`} role="status">
        <span className="nv-tile-label">
          {problems === 0 ? t('Everything is working') : t('{{count}} items need attention', { count: problems })}
        </span>
        <span className="nv-text">{t('This page updates by itself.')}</span>
      </div>

      <ul className="nv-health-list">
        {checks.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </ul>
    </NovoLayout>
  )
}

/** Telas da interface clássica: abrem com a página inteira, que tem outro layout. */
const CLASSIC = ['/home', '/settings', '/supply-depot', '/chat', '/maps']

function CheckRow({ check }: { check: HealthCheck }) {
  const { t } = useTranslation()
  const [sending, setSending] = useState(false)
  const external = check.action && CLASSIC.some((p) => check.action!.href.startsWith(p))
  // Ação feita no servidor (ex.: procurar conteúdo novo): botão em vez de link.
  if (check.action?.method === 'post') {
    const action = check.action
    return (
      <li className={`nv-card nv-health-item nv-health-${check.level}`}>
        <span className="nv-health-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON[check.level]} />
          </svg>
        </span>
        <span className="nv-health-body">
          <span className="nv-tile-label">{t(check.title, check.titleParams)}</span>
          {check.detail && <span className="nv-text">{t(check.detail, check.detailParams)}</span>}
          <button
            type="button"
            className="nv-link-button nv-health-action"
            disabled={sending}
            onClick={() => {
              setSending(true)
              router.post(action.href, {}, { preserveScroll: true, onFinish: () => setSending(false) })
            }}
          >
            {sending ? t('Checking…') : `${t(action.label)} →`}
          </button>
        </span>
      </li>
    )
  }
  return (
    <li className={`nv-card nv-health-item nv-health-${check.level}`}>
      <span className="nv-health-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICON[check.level]} />
        </svg>
      </span>
      <span className="nv-health-body">
        <span className="nv-tile-label">{t(check.title, check.titleParams)}</span>
        {check.detail && <span className="nv-text">{t(check.detail, check.detailParams)}</span>}
        {check.action &&
          (external ? (
            <a className="nv-health-action" href={check.action.href}>
              {t(check.action.label)} →
            </a>
          ) : (
            <Link className="nv-health-action" href={check.action.href}>
              {t(check.action.label)} →
            </Link>
          ))}
      </span>
    </li>
  )
}
