import { Head, Link, router } from '@inertiajs/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import api from '~/lib/api'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import { getPrimaryDiskInfo } from '~/hooks/useDiskDisplayData'
import useInternetStatus from '~/hooks/useInternetStatus'
import type { KitPlan } from '../../../types/kits'
import type { KitId } from '../../../constants/kits'

/** Folga exigida no disco além do tamanho do kit. */
const DISK_MARGIN = 1.15

/** Montagem do servidor por kits de conteúdo. */
export default function NovoMontar(props: { kits: KitPlan[]; result: string }) {
  const { t, i18n } = useTranslation()
  const { isOnline } = useInternetStatus()
  const { data: systemInfo } = useSystemInfo({ enabled: true })
  const disk = getPrimaryDiskInfo(systemInfo?.disk, systemInfo?.fsSize)
  const freeMb = disk ? (disk.totalSize - disk.totalUsed) / (1024 * 1024) : null

  const fits = (kit: KitPlan) => freeMb === null || kit.pendingMb * DISK_MARGIN <= freeMb
  // Sugestão: o kit "Recomendado" quando falta e cabe; senão, o maior que cabe.
  const available = props.kits.filter((k) => k.status === 'available' && fits(k))
  const recommended = available.find((k) => k.id === 'recommended') ?? available[available.length - 1]
  const [selected, setSelected] = useState<KitId | null>(recommended?.id ?? null)
  const [sending, setSending] = useState(false)
  const selectedKit = props.kits.find((k) => k.id === selected) ?? null

  const gb = (mb: number) =>
    new Intl.NumberFormat(i18n.language, { maximumFractionDigits: mb < 10240 ? 1 : 0 }).format(mb / 1024)

  const { data: jobs } = useQuery({
    queryKey: ['novo-montar-downloads'],
    queryFn: () => api.listDownloadJobs(),
    refetchInterval: (query) => ((query.state.data?.length ?? 0) > 0 ? 3000 : 15000),
  })

  const apply = () => {
    if (!selectedKit || selectedKit.status !== 'available' || !isOnline) return
    setSending(true)
    router.post('/novo/montar', { kit: selectedKit.id }, { onFinish: () => setSending(false) })
  }

  return (
    <NovoLayout>
      <Head title={t('Set up the server')} />

      <Link href="/novo" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('What will this server keep?')}</h1>
        <p className="nv-text">{t('Choose a kit. Nothing already downloaded is deleted, and you can add more later.')}</p>
      </div>

      {props.result === 'iniciado' && (
        <div className="nv-card nv-card-ok" role="status">
          <span className="nv-tile-label">{t('Download started')}</span>
          <span className="nv-text">{t('You can close this page. Whatever is ready can already be used.')}</span>
        </div>
      )}
      {props.result === 'nada' && (
        <div className="nv-card nv-card-ok" role="status">
          <span className="nv-tile-label">{t('Nothing to download')}</span>
          <span className="nv-text">{t('Everything in this kit is already on the server or downloading.')}</span>
        </div>
      )}
      {props.result === 'erro' && (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('Could not start the download')}</span>
          <span className="nv-text">{t('Check the internet connection and try again.')}</span>
        </div>
      )}

      {freeMb !== null && (
        <div className="nv-card nv-disk">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7 H20 V17 H4 Z M8 12 H8.01" />
          </svg>
          <span className="nv-text">
            {t('Free space on this disk:')} <strong>{gb(freeMb)} GB</strong>
          </span>
        </div>
      )}

      <div className="nv-kits" role="radiogroup" aria-label={t('Kits')}>
        {props.kits.map((kit) => {
          const isSelected = kit.id === selected
          const tooBig = kit.status === 'available' && !fits(kit)
          const disabled = kit.status !== 'available' || tooBig
          return (
            <button
              key={kit.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={disabled}
              className={`nv-kit${isSelected ? ' nv-kit-selected' : ''}`}
              onClick={() => !disabled && setSelected(kit.id)}
            >
              <span className="nv-kit-head">
                <span className="nv-kit-name">{t(kit.name)}</span>
                <span className="nv-kit-size">
                  {kit.status === 'available' && kit.pendingMb < kit.totalMb
                    ? t('{{pending}} GB left of {{total}} GB', { pending: gb(kit.pendingMb), total: gb(kit.totalMb) })
                    : t('about {{size}} GB', { size: gb(kit.totalMb) })}
                </span>
              </span>
              {kit.status === 'installed' && <span className="nv-badge nv-badge-ok">{t('Already on this server')}</span>}
              {kit.status === 'downloading' && <span className="nv-badge">{t('Downloading')}</span>}
              {kit.status === 'available' && kit.id === recommended?.id && (
                <span className="nv-badge nv-badge-strong">{t('Recommended for this disk')}</span>
              )}
              {tooBig && <span className="nv-badge nv-badge-warn">{t('Does not fit on this disk')}</span>}
              <span className="nv-text">{t(kit.description)}</span>
            </button>
          )
        })}
      </div>

      {selectedKit?.status === 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            className="nv-primary"
            onClick={apply}
            disabled={sending || !isOnline}
          >
            {sending ? t('Starting…') : t('Download the {{kit}} kit', { kit: t(selectedKit.name) })}
          </button>
          <p className="nv-text nv-center">
            {isOnline
              ? t('Internet is needed only now, to download. After that it works without it.')
              : t('No internet connection. Connect to download the kit.')}
          </p>
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <section className="nv-card" aria-live="polite">
          <h2 className="nv-section-label">{t('Downloads in progress')}</h2>
          {jobs.map((job) => (
            <div key={job.jobId} className="nv-progress">
              <div className="nv-progress-head">
                <span className="nv-progress-name">{job.title || job.filepath.split('/').pop()}</span>
                <span className="nv-progress-status">
                  {job.status === 'failed'
                    ? t('Failed')
                    : job.status === 'waiting' || job.status === 'delayed'
                      ? t('In line')
                      : `${Math.round(job.progress)}%`}
                </span>
              </div>
              <div className="nv-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(job.progress)}>
                <div className="nv-bar-fill" style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }} />
              </div>
            </div>
          ))}
        </section>
      )}
    </NovoLayout>
  )
}
