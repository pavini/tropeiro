import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { BackLink, LabelText, drugHref, useDrugText } from '~/novo/remedios'
import type { DrugInteractionEntry } from '../../../types/drug_reference'
import { mencionados } from '../../../app/utils/remedios'

/** O que a bula de cada remédio diz sobre interações, lado a lado. */
export default function NovoRemediosComparar(props: { remedios: DrugInteractionEntry[] }) {
  const { t } = useTranslation()
  const text = useDrugText()
  const escolhidos = props.remedios.map((r) => ({ id: r.id, name: text.name(r) }))
  const ids = escolhidos.map((e) => e.id).join(',')

  return (
    <NovoLayout>
      <Head title={t('Compare interactions')} />
      <BackLink href={ids ? `/remedios?comparar=${ids}` : '/remedios'} label={t('Medicines')} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Compare interactions')}</h1>
        <p className="nv-text">{t('What the label of each medicine says about taking it with others.')}</p>
      </div>

      <p className="nv-card nv-guide-note nv-text" role="note">
        <strong>{t('This is not an interaction checker.')}</strong>{' '}
        {t('It only shows what each label says. If a label says nothing, that does not mean it is safe to combine. When in doubt, take one at a time and ask a pharmacist or doctor as soon as you can.')}
      </p>

      {props.remedios.length < 2 ? (
        <div className="nv-card">
          <span className="nv-tile-label">{t('Choose at least two medicines')}</span>
          <span className="nv-text">{t('Look up each medicine and tap “Compare”.')}</span>
          <Link href={ids ? `/remedios?comparar=${ids}` : '/remedios'} className="nv-primary">
            {t('Look up medicines')}
          </Link>
        </div>
      ) : (
        <div className="nv-compare">
          {props.remedios.map((r) => {
            const others = mencionados(r, props.remedios)
            return (
              <section key={r.id} className="nv-card nv-label-section">
                <Link href={drugHref(r.id, escolhidos)} className="nv-tile-label" lang="en">
                  {text.name(r)}
                </Link>
                {r.brand_name && r.generic_name && <span className="nv-text" lang="en">{r.generic_name}</span>}
                {others.length > 0 && (
                  <span className="nv-badge nv-badge-warn">
                    {t('The label mentions {{names}}', { names: others.map((o) => text.name(o)).join(', ') })}
                  </span>
                )}
                {r.drug_interactions ? (
                  <LabelText text={r.drug_interactions} />
                ) : (
                  <span className="nv-text">{t('The label has no section about interactions.')}</span>
                )}
              </section>
            )
          })}
        </div>
      )}
    </NovoLayout>
  )
}
