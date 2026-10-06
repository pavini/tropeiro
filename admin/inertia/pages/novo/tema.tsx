import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import type { ContentType } from '../../../types/conteudo'

interface Item {
  id: string
  type: ContentType
  title: string
  summary: string
  href: string
}

/** Grupos na ordem em que aparecem; as chaves são de tradução. */
const GROUPS: { type: ContentType; label: string }[] = [
  { type: 'ficha', label: 'Emergency cards' },
  { type: 'guia', label: 'Guides' },
  { type: 'referencia', label: 'Quick reference' },
]

/** Conteúdos de um tema, por tipo. */
export default function NovoTema(props: { theme: { id: string; title: string; description: string }; items: Item[] }) {
  const { t } = useTranslation()
  return (
    <NovoLayout>
      <Head title={props.theme.title} />

      <Link href="/temas" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Topics')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{props.theme.title}</h1>
        <p className="nv-text">{props.theme.description}</p>
      </div>

      {GROUPS.map(({ type, label }) => {
        const items = props.items.filter((i) => i.type === type)
        if (items.length === 0) return null
        return (
          <section key={type} className="nv-content-group">
            <h2 className="nv-section-label">{t(label)}</h2>
            <div className="nv-content-list">
              {items.map((item) => (
                <Link key={item.id} href={item.href} className={`nv-card nv-card-link${type === 'ficha' ? ' nv-card-ficha' : ''}`}>
                  <span className="nv-tile-label">{item.title}</span>
                  <span className="nv-text">{item.summary}</span>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </NovoLayout>
  )
}
