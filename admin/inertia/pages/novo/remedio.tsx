import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { BackLink, CompareBar, DrugNotice, LabelText, RX, toggleCompare, useDrugText, type Escolhido } from '~/novo/remedios'
import type { DrugLabelDetail } from '../../../types/drug_reference'
import type { ConditionSummary } from '../../../types/conditions'

/** Bula de um remédio, com as seções na ordem de quem precisa decidir rápido. */
export default function NovoRemedio(props: {
  label: DrugLabelDetail
  situacoes: ConditionSummary[]
  comparar: Escolhido[]
  ftn: { nome: string; pagina: number } | null
  ftnId: string
}) {
  const { t } = useTranslation()
  const text = useDrugText()
  const { label } = props
  const name = text.name(label)
  const chosen = props.comparar.some((e) => e.id === label.id)
  const back = props.comparar.length ? `/remedios?comparar=${props.comparar.map((e) => e.id).join(',')}` : '/remedios'

  const sections: { title: string; body: string | null }[] = [
    { title: 'What it is for', body: label.indications },
    { title: 'How to use', body: label.dosage },
    { title: 'Do not use', body: label.contraindications },
    { title: 'Warnings', body: label.warnings },
    { title: 'When using', body: label.when_using },
    { title: 'Stop using and get help if', body: label.stop_use },
    { title: 'Interactions with other medicines', body: label.drug_interactions },
  ]

  return (
    <NovoLayout>
      <Head title={name} />
      <BackLink href={back} label={t('Medicines')} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title" lang="en">{name}</h1>
        {label.brand_name && label.generic_name && <p className="nv-text" lang="en">{label.generic_name}</p>}
        <p className="nv-text">
          {[text.route(label.route), text.type(label.product_type), label.manufacturer].filter(Boolean).join(' · ')}
        </p>
      </div>

      {props.ftn && (
        <a href={`/referencias/${props.ftnId}#page=${props.ftn.pagina}`} target="_blank" rel="noreferrer" className="nv-card nv-card-link nv-card-ficha">
          <span className="nv-tile-label">{t('Read in Portuguese')}</span>
          <span className="nv-text">
            {t('National Therapeutic Formulary (Ministry of Health), page {{page}}: {{name}}.', { page: props.ftn.pagina, name: props.ftn.nome })}
          </span>
        </a>
      )}

      {label.product_type === RX && (
        <p className="nv-card nv-guide-note nv-text" role="note">
          {t('In the United States this medicine needs a prescription. Use it only with guidance from a health professional.')}
        </p>
      )}

      {label.boxed_warning && (
        <section className="nv-card nv-card-error nv-label-section" role="alert">
          <h2 className="nv-tile-label">{t('Serious warning')}</h2>
          <LabelText text={label.boxed_warning} />
        </section>
      )}

      {sections
        .filter((s) => s.body)
        .map((s) => (
          <section key={s.title} className="nv-card nv-label-section">
            <h2 className="nv-tile-label">{t(s.title)}</h2>
            <LabelText text={s.body} />
          </section>
        ))}

      {props.situacoes.length > 0 && (
        <section className="nv-book">
          <h2 className="nv-section-label">{t('Used for')}</h2>
          <div className="nv-chips">
            {props.situacoes.map((s) => (
              <Link key={s.slug} href={`/remedios/situacao/${s.slug}`} className="nv-chip nv-chip-link">
                {t(s.label)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        className={chosen ? 'nv-primary nv-secondary' : 'nv-primary'}
        aria-pressed={chosen}
        onClick={() => toggleCompare(props.comparar, { id: label.id, name })}
      >
        {chosen ? t('Remove from comparison') : t('Compare with another medicine')}
      </button>
      {chosen && props.comparar.length < 2 && (
        <p className="nv-text">{t('Now look up the other medicine and tap “Compare”.')}</p>
      )}
      <CompareBar compare={props.comparar} />

      <DrugNotice />
      <p className="nv-text nv-drug-maker">
        {t('FDA label')}
        {label.source_updated_at ? ` · ${t('updated on {{date}}', { date: label.source_updated_at })}` : ''}
        {label.product_ndc ? ` · NDC ${label.product_ndc}` : ''}
      </p>
    </NovoLayout>
  )
}
