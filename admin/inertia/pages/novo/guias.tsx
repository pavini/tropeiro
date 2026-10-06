import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'

interface Track {
  id: string
  title: string
  description: string
  guides: { slug: string; title: string; summary: string; order: number }[]
}

/** Trilhas de guias, cada uma com as aulas na ordem. */
export default function NovoGuias(props: { tracks: Track[] }) {
  const { t } = useTranslation()
  return (
    <NovoLayout>
      <Head title={t('Guides')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Guides')}</h1>
        <p className="nv-text">{t('Learn step by step, from the basics. Each lesson shows the official documents it is based on.')}</p>
      </div>

      {props.tracks.length === 0 && <p className="nv-text">{t('No guides yet.')}</p>}

      {props.tracks.map((track) => (
        <section key={track.id} className="nv-content-group">
          <h2 className="nv-section-label">{track.title}</h2>
          <p className="nv-text">{track.description}</p>
          <ol className="nv-guide-lessons">
            {track.guides.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/guias/${guide.slug}`} className="nv-card nv-card-link nv-guide-lesson">
                  <span className="nv-guide-number" aria-hidden="true">
                    {guide.order}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span className="nv-tile-label">{guide.title}</span>
                    <span className="nv-text">{guide.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </NovoLayout>
  )
}
