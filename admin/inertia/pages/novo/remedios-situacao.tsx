import { Head } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { BackLink, CompareBar, DrugNotice, DrugRow, type Escolhido } from '~/novo/remedios'
import type { DrugSearchResult } from '../../../types/drug_reference'
import type { ConditionSummary } from '../../../types/conditions'

/** Remédios de venda livre cuja bula diz que tratam um problema. */
export default function NovoRemediosSituacao(props: {
  situacao: ConditionSummary
  remedios: DrugSearchResult[]
  instalada: boolean
  comparar: Escolhido[]
}) {
  const { t } = useTranslation()
  const back = props.comparar.length ? `/remedios?comparar=${props.comparar.map((e) => e.id).join(',')}` : '/remedios'
  return (
    <NovoLayout>
      <Head title={t(props.situacao.label)} />
      <BackLink href={back} label={t('Medicines')} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="nv-section-label">{t(props.situacao.category)}</span>
        <h1 className="nv-title">{t(props.situacao.label)}</h1>
        <p className="nv-text">
          {t('Over-the-counter medicines whose label says they treat it. Simpler ones (a single active ingredient) come first.')}
        </p>
      </div>

      <CompareBar compare={props.comparar} />

      {props.remedios.length > 0 ? (
        <ul className="nv-content-list">
          {props.remedios.map((d) => (
            <DrugRow key={d.id} drug={d} compare={props.comparar} />
          ))}
        </ul>
      ) : (
        <div className="nv-card">
          <span className="nv-tile-label">{props.instalada ? t('No medicine found for this problem') : t('The medicine labels are not on this server yet')}</span>
          {!props.instalada && <span className="nv-text">{t('Whoever manages the server can download them on the Medicines page.')}</span>}
        </div>
      )}

      <DrugNotice />
    </NovoLayout>
  )
}
