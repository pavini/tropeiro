import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { buildNeeds, type Need } from '~/novo/needs'
import type { ServiceSlim } from '../../../types/services'

// Sugestões de busca. Ficam em português: são termos de busca, não interface.
const SUGGESTIONS = ['queimadura', 'água potável', 'febre em criança', 'corte profundo']

export default function NovoInicio(props: {
  services: ServiceSlim[]
  drugReferenceInstalled: boolean
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const needs = buildNeeds(props.services, props.drugReferenceInstalled)

  const search = (q: string) => {
    const trimmed = q.trim()
    if (trimmed) router.get('/busca', { q: trimmed })
  }

  return (
    <NovoLayout>
      <Head title={t('Home')} />

      <form
        className="nv-search"
        onSubmit={(e) => {
          e.preventDefault()
          search(query)
        }}
      >
        <label htmlFor="nv-busca" className="nv-title">
          {t('What do you need?')}
        </label>
        <div className="nv-search-row">
          <input
            id="nv-busca"
            type="search"
            className="nv-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('E.g.: burn, water, fever')}
            autoComplete="off"
          />
          <button type="submit" className="nv-icon-btn" aria-label={t('Search')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20 L16.2 16.2" />
            </svg>
          </button>
        </div>
        <div className="nv-chips">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="nv-chip" onClick={() => search(s)}>
              {s}
            </button>
          ))}
        </div>
      </form>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="nv-section-label">{t('By need')}</h2>
        <div className="nv-grid">
          {needs.map((need) => (
            <NeedTile key={need.id} need={need} />
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="nv-section-label">{t('For whoever manages the server')}</h2>
        <div className="nv-fichas">
          <AdminLink href="/estado" title={t('Server status')} text={t('See if everything is working.')} />
          <AdminLink href="/montar" title={t('Set up the server')} text={t('Choose which content this server keeps.')} />
          <AdminLink href="/apps" title={t('Apps')} text={t('Install, start and stop the programs on the server.')} />
          <AdminLink href="/conteudo" title={t('Installed content')} text={t('See what is on the server and free up space.')} />
        </div>
      </section>
    </NovoLayout>
  )
}

function NeedTile({ need }: { need: Need }) {
  const { t } = useTranslation()
  const content = (
    <>
      <span className="nv-tile-icon" style={{ background: need.iconBg, color: need.iconFg }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={need.icon} />
        </svg>
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="nv-tile-label">{t(need.label)}</span>
        {!need.href && <span className="nv-tile-hint">{t('Not installed')}</span>}
      </span>
    </>
  )

  if (!need.href) {
    return (
      <div className="nv-tile" aria-disabled="true">
        {content}
      </div>
    )
  }
  if (need.external) {
    return (
      <a className="nv-tile" href={need.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }
  return (
    <Link className="nv-tile" href={need.href}>
      {content}
    </Link>
  )
}

function AdminLink({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="nv-card nv-card-link nv-admin-link">
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="nv-tile-label">{title}</span>
        <span className="nv-text">{text}</span>
      </span>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 5 L16 12 L9 19" />
      </svg>
    </Link>
  )
}
