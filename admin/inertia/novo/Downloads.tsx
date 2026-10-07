import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DownloadJobWithProgress } from '../../types/downloads'

/** Download ativo sem avançar há mais que isso aparece como parado. */
export const STALLED_MS = 5 * 60_000

export const isStalled = (job: DownloadJobWithProgress, now: number) =>
  job.status === 'active' && !!job.lastProgressTime && now - job.lastProgressTime > STALLED_MS

export const downloadName = (job: DownloadJobWithProgress) => job.title || job.filepath.split('/').pop() || job.url

type Action = 'cancel' | 'retry' | 'dismiss'

async function act(jobId: string, action: Action): Promise<boolean> {
  const id = encodeURIComponent(jobId)
  const res =
    action === 'dismiss'
      ? await fetch(`/api/downloads/jobs/${id}`, { method: 'DELETE' })
      : await fetch(`/api/downloads/jobs/${id}/${action}`, { method: 'POST' })
  if (!res.ok) return false
  const body = await res.json().catch(() => ({}))
  return body?.success !== false
}

/**
 * Downloads em andamento e com falha, com o que dá para fazer em cada um:
 * cancelar, tentar de novo ou descartar.
 */
export default function Downloads(props: { jobs: DownloadJobWithProgress[]; queryKey: unknown[] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const now = Date.now()
  const failed = props.jobs.filter((j) => j.status === 'failed')

  const run = async (jobs: DownloadJobWithProgress[], action: Action, key: string) => {
    setBusy(key)
    setError(null)
    const results = await Promise.all(jobs.map((j) => act(j.jobId, action).catch(() => false)))
    setBusy(null)
    setConfirming(null)
    if (results.some((ok) => !ok)) setError(t('Something went wrong. Try again in a moment.'))
    await queryClient.invalidateQueries({ queryKey: props.queryKey })
  }

  return (
    <section id="downloads" className="nv-card" aria-live="polite">
      <h2 className="nv-section-label">{t('Downloads')}</h2>
      {error && (
        <span className="nv-answer-error" role="alert">
          {error}
        </span>
      )}

      {props.jobs.map((job) => {
        const stalled = isStalled(job, now)
        const isFailed = job.status === 'failed'
        const waiting = job.status === 'waiting' || job.status === 'delayed'
        const name = downloadName(job)
        return (
          <div key={job.jobId} className={`nv-progress${isFailed ? ' nv-progress-failed' : ''}`}>
            <div className="nv-progress-head">
              <span className="nv-progress-name">{name}</span>
              <span className="nv-progress-status">
                {isFailed ? t('Failed') : stalled ? t('No progress') : waiting ? t('In line') : `${Math.round(job.progress)}%`}
              </span>
            </div>
            {!isFailed && (
              <div className="nv-bar" role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(job.progress)}>
                <div className="nv-bar-fill" style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }} />
              </div>
            )}
            {stalled && <span className="nv-text">{t('It has not advanced for more than 5 minutes. The internet may have dropped; you can cancel and try later.')}</span>}
            {isFailed && job.failedReason && (
              <details className="nv-progress-reason">
                <summary>{t('What happened')}</summary>
                <code>{job.failedReason}</code>
              </details>
            )}

            {confirming === job.jobId ? (
              <span className="nv-content-actions">
                <span className="nv-text">{t('Cancel the download of {{name}}? What was already downloaded is discarded.', { name })}</span>
                <button type="button" className="nv-link-button" disabled={busy !== null} onClick={() => void run([job], 'cancel', job.jobId)}>
                  {busy === job.jobId ? t('Cancelling…') : t('Yes, cancel')}
                </button>
                <button type="button" className="nv-link-button nv-text-button" disabled={busy !== null} onClick={() => setConfirming(null)}>
                  {t('Keep downloading')}
                </button>
              </span>
            ) : isFailed ? (
              <span className="nv-content-actions">
                <button type="button" className="nv-link-button nv-text-button" disabled={busy !== null} onClick={() => void run([job], 'retry', job.jobId)}>
                  {busy === job.jobId ? t('Starting…') : t('Try again')}
                </button>
                <button type="button" className="nv-link-button" disabled={busy !== null} onClick={() => void run([job], 'dismiss', `x${job.jobId}`)}>
                  {busy === `x${job.jobId}` ? t('Discarding…') : t('Discard')}
                </button>
              </span>
            ) : (
              <button type="button" className="nv-link-button" disabled={busy !== null} onClick={() => setConfirming(job.jobId)}>
                {t('Cancel download')}
              </button>
            )}
          </div>
        )
      })}

      {failed.length > 1 && (
        <span className="nv-content-actions nv-downloads-all">
          <button type="button" className="nv-link-button nv-text-button" disabled={busy !== null} onClick={() => void run(failed, 'retry', 'all-retry')}>
            {busy === 'all-retry' ? t('Starting…') : t('Try all failed again ({{count}})', { count: failed.length })}
          </button>
          <button type="button" className="nv-link-button" disabled={busy !== null} onClick={() => void run(failed, 'dismiss', 'all-dismiss')}>
            {busy === 'all-dismiss' ? t('Discarding…') : t('Discard all failed')}
          </button>
        </span>
      )}
    </section>
  )
}
