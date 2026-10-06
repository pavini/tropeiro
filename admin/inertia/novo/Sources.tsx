import { useTranslation } from 'react-i18next'
import type { FichaRef, ReferenceDocStatus } from '../../types/fichas'

/**
 * Endereço do documento guardado, já no lugar citado: página do PDF, ou o
 * trecho exato da norma guardada como página (o servidor destaca o trecho).
 */
export function referenceLink(id: string, ref: Pick<FichaRef, 'page' | 'anchor'>): string {
  if (ref.page) return `/referencias/${id}#page=${ref.page}`
  if (ref.anchor) return `/referencias/${id}?trecho=${encodeURIComponent(ref.anchor)}#trecho`
  return `/referencias/${id}`
}

/**
 * Fontes oficiais de uma ficha ou guia, agrupadas por documento, com link que
 * abre o PDF guardado no servidor já na página citada.
 */
export default function Sources(props: { refs: FichaRef[]; docs: ReferenceDocStatus[]; adaptation?: string }) {
  const { t } = useTranslation()
  const groups = props.refs.reduce<{ doc: ReferenceDocStatus; refs: FichaRef[] }[]>((acc, ref) => {
    const doc = props.docs.find((d) => d.id === ref.doc)
    if (!doc) return acc
    const group = acc.find((g) => g.doc.id === doc.id)
    if (group) group.refs.push(ref)
    else acc.push({ doc, refs: [ref] })
    return acc
  }, [])

  if (groups.length === 0) return null
  return (
    <section className="nv-card nv-sources" aria-labelledby="fontes">
      <h2 id="fontes" className="nv-section-label">{t('Sources')}</h2>
      {groups.map(({ doc, refs }) => (
        <div key={doc.id} className="nv-source">
          <span className="nv-source-title">
            {doc.title} — {doc.publisher}, {doc.year}
          </span>
          {doc.available ? (
            <ul className="nv-source-pages">
              {refs.map((ref) => (
                <li key={`${ref.doc}-${ref.page ?? ref.anchor}-${ref.about}`}>
                  <a href={referenceLink(doc.id, ref)} target="_blank" rel="noopener">
                    {ref.page ? t('Open on page {{page}}', { page: ref.page }) : t('Open at this passage')}
                  </a>{' '}
                  <span className="nv-text">({ref.about})</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="nv-text">
              {t('Not downloaded to this server yet. It will be downloaded automatically when there is internet.')}
            </span>
          )}
        </div>
      ))}
      {props.adaptation && <p className="nv-text nv-adaptation">{props.adaptation}</p>}
    </section>
  )
}
