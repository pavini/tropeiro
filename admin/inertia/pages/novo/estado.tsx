import { Head, Link, router } from '@inertiajs/react'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { healthChecks, overallLevel, type HealthCheck, type HealthLevel } from '~/novo/serverHealth'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import { getPrimaryDiskInfo } from '~/hooks/useDiskDisplayData'
import useInternetStatus from '~/hooks/useInternetStatus'
import type { DownloadJobWithProgress } from '../../../types/downloads'

interface Props {
  services: { name: string; label: string; isCustom: boolean; status: string }[]
  library: { installed: boolean; reachable: boolean; books: number }
  ai: { installed: boolean; model: string | null }
  references: {
    total: number
    available: number
    ai: { total: number; ready: number; failed: number } | null
  }
}

const ICON: Record<HealthLevel, string> = {
  ok: 'M5 12 L10 17 L19 7',
  info: 'M12 8 V8.01 M12 11 V16',
  warn: 'M12 7 V13 M12 16.5 V16.51',
  error: 'M7 7 L17 17 M17 7 L7 17',
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
    stoppedApps: props.services.filter((s) => s.status !== 'running').map((s) => tr(s.label, s.isCustom)),
    downloads: downloads
      ? {
          workerAlive: downloads.workerAlive,
          active: downloads.jobs.filter((j) => j.status !== 'failed').length,
          failed: downloads.jobs.filter((j) => j.status === 'failed').length,
        }
      : null,
    disk: disk ? { free: Math.max(0, disk.totalSize - disk.totalUsed), total: disk.totalSize } : null,
    references: props.references,
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
  const external = check.action && CLASSIC.some((p) => check.action!.href.startsWith(p))
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
