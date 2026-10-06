import { Link, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { parseLabelSection, isLabelSectionHeader } from '../../util/drug_interactions'
import { MAX_COMPARE } from '../../util/compare_ids'
import type { DrugSearchResult } from '../../types/drug_reference'

/** Peças comuns às telas de Remédios. Textos em inglês são chaves de tradução. */

export interface Escolhido {
  id: number
  name: string
}

export const OTC = 'HUMAN OTC DRUG'
export const RX = 'HUMAN PRESCRIPTION DRUG'

const ROUTES: Record<string, string> = {
  'ORAL': 'By mouth',
  'TOPICAL': 'On the skin',
  'CUTANEOUS': 'On the skin',
  'TRANSDERMAL': 'Skin patch',
  'NASAL': 'In the nose',
  'OPHTHALMIC': 'In the eye',
  'OTIC': 'In the ear',
  'AURICULAR (OTIC)': 'In the ear',
  'VAGINAL': 'Vaginal',
  'RECTAL': 'Rectal',
  'DENTAL': 'On the teeth and gums',
  'SUBLINGUAL': 'Under the tongue',
  'BUCCAL': 'Inside the cheek',
  'RESPIRATORY (INHALATION)': 'Inhaled',
  'INTRAVENOUS': 'Into a vein',
  'INTRAMUSCULAR': 'Into a muscle',
  'SUBCUTANEOUS': 'Under the skin',
}

export function useDrugText() {
  const { t } = useTranslation()
  return {
    name: (d: { brand_name: string | null; generic_name: string | null; id: number }) => d.brand_name ?? d.generic_name ?? `#${d.id}`,
    route: (route: string | null) =>
      route
        ? route
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)
            .map((r) => (ROUTES[r] ? t(ROUTES[r]) : r.toLowerCase()))
            .filter((r, i, all) => all.indexOf(r) === i)
            .join(', ')
        : null,
    type: (productType: string | null) =>
      productType === OTC ? t('Over the counter') : productType === RX ? t('Prescription only') : null,
  }
}

export const idsParam = (list: Escolhido[]) => list.map((e) => e.id).join(',')

/** Põe ou tira um remédio da comparação, ficando na mesma página. */
export function toggleCompare(list: Escolhido[], item: Escolhido) {
  const has = list.some((e) => e.id === item.id)
  setCompare(has ? list.filter((e) => e.id !== item.id) : [...list, item].slice(-MAX_COMPARE))
}

export function setCompare(next: Escolhido[]) {
  const url = new URL(window.location.href)
  if (next.length) url.searchParams.set('comparar', idsParam(next))
  else url.searchParams.delete('comparar')
  router.get(url.pathname + url.search, {}, { preserveScroll: true, preserveState: true })
}

/** Link para a bula, levando junto a lista de comparação. */
export const drugHref = (id: number, compare: Escolhido[]) =>
  compare.length ? `/remedios/${id}?comparar=${idsParam(compare)}` : `/remedios/${id}`

export function DrugRow({ drug, compare }: { drug: DrugSearchResult; compare: Escolhido[] }) {
  const { t } = useTranslation()
  const text = useDrugText()
  const name = text.name(drug)
  const chosen = compare.some((e) => e.id === drug.id)
  const details = [drug.brand_name && drug.generic_name ? drug.generic_name : null, text.route(drug.route), text.type(drug.product_type)].filter(Boolean)
  return (
    <li className="nv-card nv-drug">
      <Link href={drugHref(drug.id, compare)} className="nv-drug-main">
        <span className="nv-tile-label">{name}</span>
        {details.length > 0 && <span className="nv-text">{details.join(' · ')}</span>}
        {drug.manufacturer && <span className="nv-drug-maker">{drug.manufacturer}</span>}
      </Link>
      <button
        type="button"
        className={`nv-chip nv-drug-compare${chosen ? ' nv-drug-compare-on' : ''}`}
        aria-pressed={chosen}
        onClick={() => toggleCompare(compare, { id: drug.id, name })}
      >
        {chosen ? t('In comparison') : t('Compare')}
      </button>
    </li>
  )
}

/** Barra com os remédios escolhidos para comparar. */
export function CompareBar({ compare }: { compare: Escolhido[] }) {
  const { t } = useTranslation()
  if (compare.length === 0) return null
  return (
    <div className="nv-card nv-compare-bar" role="region" aria-label={t('Comparison')}>
      <span className="nv-text">
        <strong>{t('To compare:')}</strong> {compare.map((e) => e.name).join(', ')}
      </span>
      <span className="nv-content-actions">
        {compare.length >= 2 ? (
          <Link href={`/remedios/comparar?ids=${idsParam(compare)}`} className="nv-primary">
            {t('Compare interactions')}
          </Link>
        ) : (
          <span className="nv-text">{t('Choose one more medicine to compare.')}</span>
        )}
        <button type="button" className="nv-link-button" onClick={() => setCompare([])}>
          {t('Clear')}
        </button>
      </span>
    </div>
  )
}

/** Texto da bula (em inglês, como a FDA publica), em listas e parágrafos. */
export function LabelText({ text }: { text: string | null | undefined }) {
  const blocks = parseLabelSection(text)
  if (blocks.length === 0) return null
  return (
    <div className="nv-label-text" lang="en">
      {blocks.map((block, i) =>
        block.bullets ? (
          <ul key={i}>
            {block.bullets.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : isLabelSectionHeader(block.text) ? (
          <p key={i} className="nv-label-subhead">
            {block.text!.replace(/^\s*\d{1,2}\s+/, '')}
          </p>
        ) : (
          <p key={i}>
            {block.label && <span className="nv-label-number">{block.label}</span>}
            {block.text}
          </p>
        )
      )}
    </div>
  )
}

/** Aviso que acompanha toda tela de Remédios. */
export function DrugNotice() {
  const { t } = useTranslation()
  return (
    <p className="nv-card nv-guide-note nv-text" role="note">
      {t(
        'These are the original United States (FDA) labels, in English. Brand names, doses and what needs a prescription may differ from Brazil. They are information, not medical advice.'
      )}{' '}
      {t(
        'Always follow the label of the medicine you actually have. If you can, confirm with a pharmacist or doctor; if there is no help, do not combine medicines without need and stop at any sign of a bad reaction.'
      )}
    </p>
  )
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="nv-back">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5 L8 12 L15 19" />
      </svg>
      {label}
    </Link>
  )
}
