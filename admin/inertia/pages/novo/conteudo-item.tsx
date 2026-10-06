import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import NovoLayout from '~/novo/NovoLayout'
import Sources, { referenceLink } from '~/novo/Sources'
import { prepareContentMarkdown } from '~/novo/contentMarkdown'
import type { ContentItem } from '../../../types/conteudo'
import type { ReferenceDocStatus } from '../../../types/fichas'

/** Guia ou referência: o texto em Markdown, com as fontes oficiais ao lado. */
export default function NovoConteudoItem(props: {
  item: ContentItem
  theme: { id: string; title: string } | null
  seeAlso: { title: string; href: string }[]
  docs: ReferenceDocStatus[]
}) {
  const { t, i18n } = useTranslation()
  const { item } = props
  const { markdown } = prepareContentMarkdown(item.body)
  const noteRef = (id: string) => item.refs.find((r) => r.note === id)
  const updated = new Date(`${item.updated}T12:00:00`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <NovoLayout>
      <Head title={item.title} />

      <Link href={props.theme ? `/temas/${props.theme.id}` : '/temas'} className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {props.theme?.title ?? t('Topics')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{item.title}</h1>
        <p className="nv-text">{item.summary}</p>
      </div>

      <article className="nv-card nv-article nv-content-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => {
              // Nota de fonte: abre o documento no lugar citado.
              const id = href?.startsWith('#fonte-') ? href.slice('#fonte-'.length) : null
              const ref = id ? noteRef(id) : undefined
              if (ref) {
                return (
                  <sup className="nv-content-note">
                    <a href={referenceLink(ref.doc, ref)} target="_blank" rel="noopener" title={ref.about}>
                      {children}
                    </a>
                  </sup>
                )
              }
              return <a href={href}>{children}</a>
            },
            blockquote: ({ children }) => (
              <div className="nv-guide-note" role="note">
                {children}
              </div>
            ),
            table: ({ children }) => (
              <div className="nv-guide-table-wrap">
                <table className="nv-guide-table">{children}</table>
              </div>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>

      <p className="nv-text nv-content-meta">
        {t('Written by {{authors}}. Updated on {{date}}.', { authors: item.authors.join(', '), date: updated })}
        {item.reviewed && item.reviewedBy ? ` ${t('Reviewed by {{name}}.', { name: item.reviewedBy })}` : ''}
      </p>

      {!item.reviewed && (
        <div className="nv-card nv-unreviewed" role="note">
          <span className="nv-tile-label">{t('Not reviewed by a specialist yet')}</span>
          <span className="nv-text">{t('Text written from the official documents below. When in doubt, follow the official document.')}</span>
        </div>
      )}

      <Sources refs={item.refs} docs={props.docs} adaptation={item.adaptation} />

      {props.seeAlso.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="nv-section-label">{t('See also')}</h2>
          <div className="nv-chips">
            {props.seeAlso.map((s) => (
              <Link key={s.href} href={s.href} className="nv-chip nv-chip-link">
                {s.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </NovoLayout>
  )
}
