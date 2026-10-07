import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import { getPrimaryDiskInfo } from '~/hooks/useDiskDisplayData'
import type { WikipediaState } from '../../../types/downloads'

/** Folga exigida no disco além do tamanho da edição. */
const DISK_MARGIN = 1.15

/**
 * Qual edição da Wikipedia o servidor guarda. Trocar baixa a nova; a antiga só
 * sai quando a nova termina. As opções vêm do catálogo do Tropeiro, com internet.
 */
export default function NovoWikipedia(props: { state: WikipediaState | null; result: string }) {
  const { t, i18n } = useTranslation()
  const { data: systemInfo } = useSystemInfo({ enabled: true })
  const disk = getPrimaryDiskInfo(systemInfo?.disk, systemInfo?.fsSize)
  const freeMb = disk ? (disk.totalSize - disk.totalUsed) / (1024 * 1024) : null
  const current = props.state?.currentSelection ?? null
  const [chosen, setChosen] = useState<string | null>(current?.optionId ?? null)
  const [sending, setSending] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const size = (mb: number) =>
    mb >= 1024
      ? `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: mb < 10240 ? 1 : 0 }).format(mb / 1024)} GB`
      : `${new Intl.NumberFormat(i18n.language).format(mb)} MB`
  const fits = (mb: number) => freeMb === null || mb * DISK_MARGIN <= freeMb

  const options = props.state?.options ?? []
  const choice = options.find((o) => o.id === chosen) ?? null
  const isCurrent = (id: string) => current?.optionId === id && current.status === 'installed'

  const apply = () => {
    if (!choice) return
    setSending(true)
    router.post('/conteudo/wikipedia', { option: choice.id }, { onFinish: () => setSending(false) })
  }

  return (
    <NovoLayout>
      <Head title={t('Wikipedia')} />

      <Link href="/conteudo" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Installed content')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Wikipedia')}</h1>
        <p className="nv-text">
          {t('Choose which edition this server keeps. When you change it, the new one is downloaded and the old one is removed only after it finishes.')}
        </p>
      </div>

      {props.result === 'removida' && (
        <div className="nv-card nv-card-ok" role="status">
          <span className="nv-tile-label">{t('Wikipedia removed')}</span>
          <span className="nv-text">{t('The space is free again.')}</span>
        </div>
      )}
      {props.result === 'ocupado' && (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('This edition is already downloading')}</span>
          <span className="nv-text">{t('See the progress in Downloads.')}</span>
        </div>
      )}
      {props.result === 'erro' && (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('Something went wrong')}</span>
          <span className="nv-text">{t('Try again in a moment. The details are in the server log.')}</span>
        </div>
      )}

      {!props.state ? (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('Could not load the list of editions')}</span>
          <span className="nv-text">{t('The list comes from the Tropeiro catalog and needs internet. The Wikipedia already downloaded keeps working.')}</span>
        </div>
      ) : (
        <>
          {current?.status === 'downloading' && (
            <Link href="/montar#downloads" className="nv-card nv-card-link" role="status">
              <span className="nv-tile-label">{t('Downloading a new edition')}</span>
              <span className="nv-text">{t('See the progress in Downloads.')}</span>
            </Link>
          )}

          <fieldset className="nv-kits">
            <legend className="nv-sr-only">{t('Wikipedia edition')}</legend>
            {options
              .filter((o) => o.id !== 'none')
              .map((option) => {
                const fitsDisk = isCurrent(option.id) || fits(option.size_mb)
                return (
                  <label key={option.id} className={`nv-card nv-kit${chosen === option.id ? ' nv-kit-selected' : ''}`}>
                    <input
                      type="radio"
                      name="wikipedia"
                      className="nv-sr-only"
                      checked={chosen === option.id}
                      disabled={!fitsDisk}
                      onChange={() => setChosen(option.id)}
                    />
                    <span className="nv-kit-head">
                      <span className="nv-kit-name">{option.name}</span>
                      <span className="nv-kit-size">{size(option.size_mb)}</span>
                    </span>
                    {isCurrent(option.id) && <span className="nv-badge nv-badge-ok">{t('On this server')}</span>}
                    {!fitsDisk && <span className="nv-badge nv-badge-warn">{t('Does not fit on the disk')}</span>}
                    <span className="nv-text">{option.description}</span>
                  </label>
                )
              })}
          </fieldset>

          <button type="button" className="nv-primary" disabled={!choice || isCurrent(choice.id) || sending} onClick={apply}>
            {sending
              ? t('Starting…')
              : choice && !isCurrent(choice.id)
                ? t('Download {{name}}', { name: choice.name })
                : t('Choose an edition')}
          </button>

          {current && current.status === 'installed' && current.optionId !== 'none' && (
            <section className="nv-card nv-content-item">
              {confirmRemove ? (
                <div className="nv-content-confirm" role="alert">
                  <span className="nv-text">
                    <strong>{t('Remove the Wikipedia?')}</strong> {t('It will no longer appear in search or in the AI answers. To have it again, it must be downloaded with internet.')}
                  </span>
                  <span className="nv-content-actions">
                    <button type="button" className="nv-primary nv-danger" disabled={sending} onClick={() => router.post('/conteudo/wikipedia', { option: 'none' })}>
                      {t('Yes, remove')}
                    </button>
                    <button type="button" className="nv-primary nv-secondary" onClick={() => setConfirmRemove(false)}>
                      {t('Cancel')}
                    </button>
                  </span>
                </div>
              ) : (
                <button type="button" className="nv-link-button" onClick={() => setConfirmRemove(true)}>
                  {t('Remove the Wikipedia from this server')}
                </button>
              )}
            </section>
          )}
        </>
      )}
    </NovoLayout>
  )
}
