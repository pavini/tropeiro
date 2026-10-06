import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { getServiceLink } from '~/lib/navigation'
import type { ServiceSlim } from '../../../types/services'
import { SERVICE_NAMES } from '../../../constants/service_names'

/**
 * Busca da interface nova. Por enquanto encaminha a pesquisa para onde já há
 * busca (Kiwix, bulário, IA); a busca unificada em todo o acervo vem depois.
 */
export default function NovoBusca(props: {
  q: string
  services: ServiceSlim[]
  drugReferenceInstalled: boolean
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(props.q)

  const kiwix = props.services.find((s) => s.service_name === SERVICE_NAMES.KIWIX && s.installed)
  const kiwixBase = kiwix ? getServiceLink(kiwix.ui_location || '', kiwix.custom_url) : null
  const ollama = props.services.some((s) => s.service_name === SERVICE_NAMES.OLLAMA && s.installed)

  return (
    <NovoLayout>
      <Head title={props.q ? t('Search: {{q}}', { q: props.q }) : t('Search')} />

      <Link href="/novo" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <form
        className="nv-search"
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = query.trim()
          if (trimmed) router.get('/novo/busca', { q: trimmed })
        }}
      >
        <label htmlFor="nv-busca" className="nv-section-label">
          {t('Search')}
        </label>
        <div className="nv-search-row">
          <input
            id="nv-busca"
            type="search"
            className="nv-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="nv-icon-btn" aria-label={t('Search')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20 L16.2 16.2" />
            </svg>
          </button>
        </div>
      </form>

      {props.q ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h1 className="nv-title">{t('Where to look for “{{q}}”', { q: props.q })}</h1>
          <p className="nv-text">
            {t('Soon the search will cover the whole collection at once. For now, choose where to look:')}
          </p>

          {kiwixBase && (
            <a
              className="nv-card nv-card-link"
              href={`${kiwixBase}/search?pattern=${encodeURIComponent(props.q)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nv-section-label">{t('Encyclopedia and manuals')}</span>
              <span className="nv-tile-label">{t('Search the library')}</span>
              <span className="nv-text">{t('Wikipedia and the downloaded guides. Opens in a new tab.')}</span>
            </a>
          )}

          {props.drugReferenceInstalled && (
            <Link className="nv-card nv-card-link" href="/drug-reference">
              <span className="nv-section-label">{t('Medicines')}</span>
              <span className="nv-tile-label">{t('Look it up in the drug reference')}</span>
            </Link>
          )}

          {ollama && (
            <Link className="nv-card nv-card-link" href="/chat">
              <span className="nv-section-label">{t('Ask the AI')}</span>
              <span className="nv-tile-label">{t('Ask the local assistant')}</span>
              <span className="nv-text">{t('It answers using the content on this server.')}</span>
            </Link>
          )}

          {!kiwixBase && !props.drugReferenceInstalled && !ollama && (
            <div className="nv-card">
              <span className="nv-tile-label">{t('Nothing to search yet')}</span>
              <span className="nv-text">
                {t('This server has no content installed. Whoever manages it can add content in the classic interface.')}
              </span>
            </div>
          )}
        </section>
      ) : null}
    </NovoLayout>
  )
}
