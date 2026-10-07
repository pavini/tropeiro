import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { useSystemInfo } from '~/hooks/useSystemInfo'
import { getPrimaryDiskInfo } from '~/hooks/useDiskDisplayData'
import type { InstalledItem, ContentKind } from '../../../types/installed_content'

interface Props {
  books: InstalledItem[]
  maps: InstalledItem[]
  models: InstalledItem[]
  result: string
  count: number
  wikipediaFile: string | null
}

/** O que acontece quando o item some, por tipo. */
const CONSEQUENCE: Record<ContentKind, string> = {
  book: 'It will no longer appear in search or in the AI answers.',
  map: 'This area will no longer appear on the map.',
  model: 'The AI will no longer be able to answer with this model.',
}

/** Conteúdo instalado no servidor, para ver o espaço que ocupa e apagar. */
export default function NovoConteudo(props: Props) {
  const { t, i18n } = useTranslation()
  const { data: systemInfo } = useSystemInfo({ enabled: true })
  const disk = getPrimaryDiskInfo(systemInfo?.disk, systemInfo?.fsSize)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const withUpdate = [...props.books, ...props.maps].filter((item) => item.update)

  const post = (path: string, data: Record<string, string>, key: string) => {
    setUpdating(key)
    router.post(path, data, { onFinish: () => setUpdating(null) })
  }

  const size = (bytes: number | null) => {
    if (bytes === null) return null
    const gb = bytes / 1024 ** 3
    const fmt = (n: number, digits: number) =>
      new Intl.NumberFormat(i18n.language, { maximumFractionDigits: digits }).format(n)
    return gb >= 1 ? `${fmt(gb, gb < 10 ? 1 : 0)} GB` : `${fmt(Math.max(bytes / 1024 ** 2, 1), 0)} MB`
  }

  const all = [...props.books, ...props.maps, ...props.models]
  const used = all.reduce((sum, item) => sum + (item.sizeBytes ?? 0), 0)
  const free = disk ? Math.max(0, disk.totalSize - disk.totalUsed) : null

  const remove = (item: InstalledItem) => {
    setDeleting(`${item.kind}:${item.id}`)
    router.post(
      '/conteudo/apagar',
      { kind: item.kind, id: item.id },
      {
        onFinish: () => {
          setDeleting(null)
          setConfirming(null)
        },
      }
    )
  }

  const groups: { label: string; items: InstalledItem[]; empty: string }[] = [
    { label: t('Library'), items: props.books, empty: t('No books yet.') },
    { label: t('Maps'), items: props.maps, empty: t('No maps yet.') },
    { label: t('AI models'), items: props.models, empty: t('No AI models.') },
  ]

  return (
    <NovoLayout>
      <Head title={t('Installed content')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Installed content')}</h1>
        <p className="nv-text">{t('Everything this server keeps, and how much space each item takes.')}</p>
      </div>

      {props.result === 'apagado' && (
        <div className="nv-card nv-card-ok" role="status">
          <span className="nv-tile-label">{t('Deleted')}</span>
          <span className="nv-text">{t('The space is free again.')}</span>
        </div>
      )}
      {props.result === 'versoes' && (
        <div className="nv-card nv-card-ok" role="status">
          <span className="nv-tile-label">
            {props.count > 0 ? t('{{count}} items have a new version', { count: props.count }) : t('Everything is up to date')}
          </span>
        </div>
      )}
      {props.result === 'atualizando' && props.count === 0 && (
        <div className="nv-card nv-card-ok" role="status">
          <span className="nv-tile-label">{t('Nothing to update')}</span>
          <span className="nv-text">{t('The catalog no longer has a newer version, or it is already downloading.')}</span>
        </div>
      )}
      {props.result === 'atualizando' && props.count > 0 && (
        <Link href="/montar#downloads" className="nv-card nv-card-ok nv-card-link" role="status">
          <span className="nv-tile-label">{t('Downloading {{count}} new versions', { count: props.count })}</span>
          <span className="nv-text">{t('The old version stays until the new one finishes downloading. See the progress in Downloads.')}</span>
        </Link>
      )}
      {props.result === 'sem-catalogo' && (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('Could not check the catalog')}</span>
          <span className="nv-text">{t('Checking for new versions needs internet. Everything already downloaded keeps working.')}</span>
        </div>
      )}
      {props.result === 'erro' && (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('Could not delete')}</span>
          <span className="nv-text">{t('Try again. If it keeps failing, use the advanced administration.')}</span>
        </div>
      )}

      <div className="nv-card nv-disk">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7 H20 V17 H4 Z M8 12 H8.01" />
        </svg>
        <span className="nv-text">
          {t('Content takes')} <strong>{size(used)}</strong>
          {free !== null && (
            <>
              {' · '}
              {t('Free space on this disk:')} <strong>{size(free)}</strong>
            </>
          )}
        </span>
      </div>

      <section className="nv-card nv-updates" aria-labelledby="nv-versoes">
        <h2 id="nv-versoes" className="nv-tile-label">
          {withUpdate.length > 0 ? t('{{count}} items have a new version', { count: withUpdate.length }) : t('New versions')}
        </h2>
        <span className="nv-text">
          {withUpdate.length > 0
            ? t('Updating downloads the new version; the old one is replaced only when it finishes.')
            : t('The server checks the catalog by itself when there is internet.')}
        </span>
        <span className="nv-content-actions">
          {withUpdate.length > 0 && (
            <button type="button" className="nv-primary nv-app-button" disabled={updating !== null} onClick={() => post('/conteudo/atualizar', {}, 'all')}>
              {updating === 'all' ? t('Starting…') : t('Update all')}
            </button>
          )}
          <button type="button" className="nv-link-button nv-text-button" disabled={updating !== null} onClick={() => post('/conteudo/versoes', {}, 'check')}>
            {updating === 'check' ? t('Checking…') : t('Check for new versions now')}
          </button>
        </span>
      </section>

      {groups.map((group) => (
        <section key={group.label} className="nv-content-group">
          <h2 className="nv-section-label">{group.label}</h2>
          {group.items.length === 0 ? (
            <p className="nv-text">{group.empty}</p>
          ) : (
            <ul className="nv-content-list">
              {group.items.map((item) => {
                const key = `${item.kind}:${item.id}`
                const itemSize = size(item.sizeBytes)
                return (
                  <li key={key} className="nv-card nv-content-item">
                    <span className="nv-content-head">
                      <span className="nv-tile-label">{item.title}</span>
                      {itemSize && <span className="nv-content-size">{itemSize}</span>}
                    </span>
                    {item.description && <span className="nv-text">{item.description}</span>}
                    {item.update && (
                      <span className="nv-content-update">
                        <span className="nv-badge nv-badge-warn">
                          {t('New version: {{version}}', { version: item.update.version })}
                        </span>
                        <button
                          type="button"
                          className="nv-link-button nv-text-button"
                          disabled={updating !== null}
                          onClick={() => post('/conteudo/atualizar', { resourceId: item.update!.resourceId }, item.id)}
                        >
                          {updating === item.id
                            ? t('Starting…')
                            : item.update.sizeBytes
                              ? t('Update ({{size}})', { size: size(item.update.sizeBytes) })
                              : t('Update')}
                        </button>
                      </span>
                    )}
                    {item.id === props.wikipediaFile && (
                      <Link href="/conteudo/wikipedia" className="nv-link-button nv-text-button">
                        {t('Change the Wikipedia edition')}
                      </Link>
                    )}

                    {confirming === key ? (
                      <div className="nv-content-confirm" role="alert">
                        <span className="nv-text">
                          <strong>{t('Delete {{title}}?', { title: item.title })}</strong> {t(CONSEQUENCE[item.kind])}{' '}
                          {item.wikipedia && t('The kits will offer a Wikipedia to download again.')}{' '}
                          {t('To have it again, it must be downloaded with internet.')}
                        </span>
                        <span className="nv-content-actions">
                          <button type="button" className="nv-primary nv-danger" disabled={deleting !== null} onClick={() => remove(item)}>
                            {deleting === key ? t('Deleting…') : t('Yes, delete')}
                          </button>
                          <button type="button" className="nv-primary nv-secondary" disabled={deleting !== null} onClick={() => setConfirming(null)}>
                            {t('Cancel')}
                          </button>
                        </span>
                      </div>
                    ) : (
                      <button type="button" className="nv-link-button" onClick={() => setConfirming(key)}>
                        {t('Delete')}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ))}

      <Link href="/montar" className="nv-card nv-card-link">
        <span className="nv-tile-label">{t('Add content')}</span>
        <span className="nv-text">{t('Choose a kit to download more.')}</span>
      </Link>
      <Link href="/conteudo/wikipedia" className="nv-card nv-card-link">
        <span className="nv-tile-label">{t('Wikipedia')}</span>
        <span className="nv-text">{t('Choose which edition this server keeps, from a quick reference to the full one with images.')}</span>
      </Link>
    </NovoLayout>
  )
}
