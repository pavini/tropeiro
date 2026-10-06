import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import Sources from '~/novo/Sources'
import type { Guide, GuideBlock } from '../../../types/guias'
import type { ReferenceDocStatus } from '../../../types/fichas'

type Near = { slug: string; title: string } | null

/** Aula de um guia: seções com texto, listas e tabelas, e as fontes oficiais. */
export default function NovoGuia(props: {
  guide: Guide
  track: { id: string; title: string } | null
  position: { current: number; total: number }
  previous: Near
  next: Near
  docs: ReferenceDocStatus[]
}) {
  const { t } = useTranslation()
  const { guide } = props

  return (
    <NovoLayout>
      <Head title={guide.title} />

      <Link href="/guias" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Guides')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {props.track && (
          <span className="nv-section-label">
            {props.track.title} · {t('Lesson {{current}} of {{total}}', props.position)}
          </span>
        )}
        <h1 className="nv-title">{guide.title}</h1>
        <p className="nv-text">{guide.summary}</p>
      </div>

      {guide.sections.map((section, i) => (
        <section key={i} className="nv-card nv-guide-section">
          <h2 className="nv-ficha-heading">{section.title}</h2>
          {section.blocks.map((block, j) => (
            <Block key={j} block={block} />
          ))}
        </section>
      ))}

      {!guide.reviewed && (
        <div className="nv-card nv-unreviewed" role="note">
          <span className="nv-tile-label">{t('Not reviewed by a specialist yet')}</span>
          <span className="nv-text">{t('Text written from the official documents below. When in doubt, follow the official document.')}</span>
        </div>
      )}

      <Sources refs={guide.refs} docs={props.docs} />

      {(props.previous || props.next) && (
        <nav className="nv-guide-nav" aria-label={t('Lessons')}>
          {props.previous ? (
            <Link href={`/guias/${props.previous.slug}`} className="nv-card nv-card-link">
              <span className="nv-section-label">{t('Previous lesson')}</span>
              <span className="nv-tile-label">{props.previous.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {props.next && (
            <Link href={`/guias/${props.next.slug}`} className="nv-card nv-card-link nv-guide-next">
              <span className="nv-section-label">{t('Next lesson')}</span>
              <span className="nv-tile-label">{props.next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </NovoLayout>
  )
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.kind) {
    case 'text':
      return <p className="nv-guide-text">{block.text}</p>
    case 'note':
      return (
        <p className="nv-guide-note" role="note">
          {block.text}
        </p>
      )
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <List className="nv-ficha-list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </List>
      )
    }
    case 'table':
      return (
        <div className="nv-guide-table-wrap">
          <table className="nv-guide-table">
            {block.caption && <caption>{block.caption}</caption>}
            <thead>
              <tr>
                {block.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.note && <p className="nv-text nv-guide-table-note">{block.note}</p>}
        </div>
      )
  }
}
