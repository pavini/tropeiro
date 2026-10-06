import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import EmergencyNumbers from '~/novo/EmergencyNumbers'

/** Lista das fichas de primeiros socorros. */
export default function NovoFichas(props: { fichas: { slug: string; title: string; summary: string }[] }) {
  const { t } = useTranslation()
  return (
    <NovoLayout>
      <Head title={t('First aid')} />

      <Link href="/novo" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <EmergencyNumbers />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('First aid')}</h1>
        <p className="nv-text">{t('What to do now, step by step. Each card shows the official document it is based on.')}</p>
      </div>

      <div className="nv-fichas">
        {props.fichas.map((ficha) => (
          <Link key={ficha.slug} href={`/novo/fichas/${ficha.slug}`} className="nv-card nv-card-link">
            <span className="nv-tile-label">{ficha.title}</span>
            <span className="nv-text">{ficha.summary}</span>
          </Link>
        ))}
      </div>
    </NovoLayout>
  )
}
