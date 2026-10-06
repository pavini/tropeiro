import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import EmergencyNumbers from '~/novo/EmergencyNumbers'
import Sources from '~/novo/Sources'
import type { Ficha, FichaSection, ReferenceDocStatus } from '../../../types/fichas'

/** Ficha de primeiros socorros: o que fazer agora, com a fonte oficial ao lado. */
export default function NovoFicha(props: {
  ficha: Ficha
  docs: ReferenceDocStatus[]
  related: { slug: string; title: string }[]
}) {
  const { t } = useTranslation()
  const { ficha } = props

  return (
    <NovoLayout>
      <Head title={ficha.title} />

      <Link href="/fichas" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('First aid')}
      </Link>

      <EmergencyNumbers />

      <h1 className="nv-title">{ficha.title}</h1>

      {ficha.callFirst && (
        <div className="nv-card nv-call-first" role="alert">
          <span className="nv-tile-label">{ficha.callFirst}</span>
        </div>
      )}

      {ficha.sections.map((section, i) => (
        <Section key={i} section={section} />
      ))}

      <div className="nv-card nv-unreviewed" role="note">
        <span className="nv-tile-label">{t('Not reviewed by a health professional')}</span>
        <span className="nv-text">
          {t('Text written from the official documents below. It does not replace emergency care: when in doubt, call 192.')}
        </span>
      </div>

      <Sources refs={ficha.refs} docs={props.docs} adaptation={ficha.adaptation} />

      {props.related.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="nv-section-label">{t('Other first aid cards')}</h2>
          <div className="nv-chips">
            {props.related.map((r) => (
              <Link key={r.slug} href={`/fichas/${r.slug}`} className="nv-chip nv-chip-link">
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </NovoLayout>
  )
}

function Section({ section }: { section: FichaSection }) {
  const { t } = useTranslation()
  const fallback = { do: t('Do'), dont: t('Do not'), help: t('Get help') }[section.kind]
  const List = section.kind === 'do' ? 'ol' : 'ul'
  return (
    <section className={`nv-card nv-ficha-${section.kind}`}>
      <h2 className="nv-ficha-heading">{section.title ?? fallback}</h2>
      <List className="nv-ficha-list">
        {section.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </List>
    </section>
  )
}
