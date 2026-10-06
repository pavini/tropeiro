import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'

/** Temas do conteúdo do Tropeiro (pasta conteudo/). */
export default function NovoTemas(props: { themes: { id: string; title: string; description: string; count: number }[] }) {
  const { t } = useTranslation()
  return (
    <NovoLayout>
      <Head title={t('Topics')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Topics')}</h1>
        <p className="nv-text">{t('Content written for this server, each with the official documents it is based on.')}</p>
      </div>

      <div className="nv-content-list">
        {props.themes.map((theme) => (
          <Link key={theme.id} href={`/temas/${theme.id}`} className="nv-card nv-card-link">
            <span className="nv-tile-label">{theme.title}</span>
            <span className="nv-text">{theme.description}</span>
            <span className="nv-section-label">{t('{{count}} contents', { count: theme.count })}</span>
          </Link>
        ))}
      </div>
    </NovoLayout>
  )
}
