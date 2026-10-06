import { Head, Link, router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { BackLink, CompareBar, DrugNotice, DrugRow, type Escolhido } from '~/novo/remedios'
import type { DrugSearchResult } from '../../../types/drug_reference'
import type { ConditionSummary } from '../../../types/conditions'
import type { BuscaDeRemedio, EstadoDaBase } from '../../../app/utils/remedios'
import { situacoesQueCombinam } from '../../../app/utils/remedios'

/** Remédios: buscar pelo nome, procurar pela situação e comparar. */
export default function NovoRemedios(props: {
  estado: EstadoDaBase
  rowCount: number
  progresso: { percent: number | null; etapa: 'baixando' | 'organizando' } | null
  erro: string | null
  situacoes: ConditionSummary[]
  q: string
  busca: BuscaDeRemedio | null
  resultados: DrugSearchResult[]
  comparar: Escolhido[]
  resultado: string
}) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState(props.q)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const pronta = props.rowCount > 0
  const andamento = props.estado === 'baixando' || props.estado === 'organizando'

  // Enquanto baixa ou organiza, a página se atualiza sozinha.
  useEffect(() => {
    if (!andamento) return
    const timer = setInterval(() => router.reload({ only: ['estado', 'rowCount', 'progresso', 'erro'] }), 5000)
    return () => clearInterval(timer)
  }, [andamento])

  const porCategoria = useMemo(() => {
    const map = new Map<string, ConditionSummary[]>()
    for (const s of props.situacoes) map.set(s.category, [...(map.get(s.category) ?? []), s])
    return [...map]
  }, [props.situacoes])

  const situacoesDaBusca = props.q ? situacoesQueCombinam(props.situacoes, props.q, (s) => t(s)) : []
  const compareParam = props.comparar.length ? `?comparar=${props.comparar.map((e) => e.id).join(',')}` : ''
  const count = new Intl.NumberFormat(i18n.language).format(props.rowCount)

  const post = (path: string) => {
    setSending(true)
    router.post(path, {}, { onFinish: () => setSending(false) })
  }

  return (
    <NovoLayout>
      <Head title={t('Medicines')} />
      <BackLink href="/" label={t('Home')} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Medicines')}</h1>
        <p className="nv-text">{t('Look up a medicine by name, or start from the problem to see which medicines are used for it.')}</p>
      </div>

      {props.resultado === 'removida' && (
        <div className="nv-card nv-card-ok" role="status">
          <span className="nv-tile-label">{t('Medicine labels removed')}</span>
          <span className="nv-text">{t('The space is free again.')}</span>
        </div>
      )}
      {props.resultado === 'erro' && (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('Something went wrong')}</span>
          <span className="nv-text">{t('Try again in a moment. The details are in the server log.')}</span>
        </div>
      )}

      {props.estado === 'ausente' && (
        <div className="nv-card">
          <span className="nv-tile-label">{t('The medicine labels are not on this server yet')}</span>
          <span className="nv-text">
            {t('They are downloaded once, with internet (about 1.7 GB), and then work offline.')}
          </span>
          <button type="button" className="nv-primary" disabled={sending} onClick={() => post('/remedios/instalar')}>
            {sending ? t('Starting…') : t('Download the medicine labels')}
          </button>
        </div>
      )}

      {andamento && (
        <div className="nv-card" role="status" aria-live="polite">
          <span className="nv-tile-label">
            {props.estado === 'baixando' ? t('Downloading the medicine labels') : t('Preparing the labels for search')}
          </span>
          {props.progresso?.percent !== null && props.progresso?.percent !== undefined && (
            <>
              <div className="nv-bar" aria-hidden="true">
                <div className="nv-bar-fill" style={{ width: `${props.progresso.percent}%` }} />
              </div>
              <span className="nv-text">{props.progresso.percent}%</span>
            </>
          )}
          <span className="nv-text">{t('You can leave this page; it continues on the server.')}</span>
        </div>
      )}

      {props.estado === 'baixada' && (
        <div className="nv-card">
          <span className="nv-tile-label">{t('The labels were downloaded')}</span>
          <span className="nv-text">{t('One step is missing: preparing them for search.')}</span>
          <button type="button" className="nv-primary" disabled={sending} onClick={() => post('/remedios/instalar')}>
            {t('Prepare for search')}
          </button>
        </div>
      )}

      {props.estado === 'falhou' && !pronta && (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('The medicine labels could not be installed')}</span>
          {props.erro && <span className="nv-text">{props.erro}</span>}
          <button type="button" className="nv-primary" disabled={sending} onClick={() => post('/remedios/instalar')}>
            {t('Try again')}
          </button>
        </div>
      )}

      {pronta && (
        <>
          <form
            className="nv-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              const q = query.trim()
              const params: Record<string, string> = q ? { q } : {}
              if (props.comparar.length) params.comparar = props.comparar.map((x) => x.id).join(',')
              router.get('/remedios', params)
            }}
          >
            <label htmlFor="nv-remedio" className="nv-section-label">
              {t('Medicine name')}
            </label>
            <div className="nv-search-row">
              <input
                id="nv-remedio"
                type="search"
                className="nv-input"
                value={query}
                placeholder={t('e.g. paracetamol, ibuprofen, loratadine')}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="nv-icon-btn" aria-label={t('Search')}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20 L16.2 16.2" />
                </svg>
              </button>
            </div>
          </form>

          <CompareBar compare={props.comparar} />

          {props.q ? (
            <section className="nv-results" aria-live="polite">
              {props.busca?.traduzidoDe && (
                <p className="nv-text">
                  {t('In United States labels, {{original}} is called {{term}}.', { original: props.busca.traduzidoDe, term: props.busca.termo })}
                </p>
              )}
              {props.busca?.foraDosEua && (
                <div className="nv-card nv-guide-note">
                  <span className="nv-text">{t(props.busca.foraDosEua.motivo)}</span>
                  {props.busca.foraDosEua.parecido && (
                    <Link href={`/remedios?q=${encodeURIComponent(props.busca.foraDosEua.parecido)}`} className="nv-chip nv-chip-link">
                      {t('See {{name}}', { name: props.busca.foraDosEua.parecido })}
                    </Link>
                  )}
                </div>
              )}

              {situacoesDaBusca.length > 0 && (
                <section className="nv-book">
                  <h2 className="nv-section-label">{t('Problems')}</h2>
                  <div className="nv-chips">
                    {situacoesDaBusca.map((s) => (
                      <Link key={s.slug} href={`/remedios/situacao/${s.slug}${compareParam}`} className="nv-chip nv-chip-link">
                        {t(s.label)}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {props.resultados.length > 0 ? (
                <section className="nv-book">
                  <h2 className="nv-section-label">{t('Medicines')}</h2>
                  <ul className="nv-content-list">
                    {props.resultados.map((d) => (
                      <DrugRow key={d.id} drug={d} compare={props.comparar} />
                    ))}
                  </ul>
                </section>
              ) : (
                situacoesDaBusca.length === 0 &&
                !props.busca?.foraDosEua && (
                  <div className="nv-card">
                    <span className="nv-tile-label">{t('Nothing found for “{{q}}”', { q: props.q })}</span>
                    <span className="nv-text">
                      {t('Try the name of the active ingredient (the generic name), or start from the problem below.')}
                    </span>
                  </div>
                )
              )}

              <Link href={`/remedios${compareParam}`} className="nv-link-button">
                {t('See all problems')}
              </Link>
            </section>
          ) : (
            <section className="nv-results">
              <h2 className="nv-section-label">{t('By problem')}</h2>
              <p className="nv-text">{t('Over-the-counter medicines whose label says they treat it.')}</p>
              {porCategoria.map(([category, list]) => (
                <section key={category} className="nv-book">
                  <h3 className="nv-tile-label">{t(category)}</h3>
                  <div className="nv-chips">
                    {list.map((s) => (
                      <Link key={s.slug} href={`/remedios/situacao/${s.slug}${compareParam}`} className="nv-chip nv-chip-link">
                        {t(s.label)}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </section>
          )}
        </>
      )}

      <DrugNotice />

      {pronta && !andamento && (
        <section className="nv-content-group">
          <h2 className="nv-section-label">{t('For whoever manages the server')}</h2>
          <div className="nv-card nv-content-item">
            <span className="nv-text">{t('{{formatted}} labels saved on this server.', { count: props.rowCount, formatted: count })}</span>
            {props.estado === 'falhou' && (
              <div className="nv-content-confirm" role="alert">
                <span className="nv-text">
                  <strong>{t('The last update of the labels failed.')}</strong> {t('The saved labels keep working.')}
                  {props.erro && ` ${props.erro}`}
                </span>
                <button type="button" className="nv-primary nv-secondary" disabled={sending} onClick={() => post('/remedios/instalar')}>
                  {t('Try again')}
                </button>
              </div>
            )}
            {confirming ? (
              <div className="nv-content-confirm" role="alert">
                <span className="nv-text">
                  <strong>{t('Remove the medicine labels?')}</strong>{' '}
                  {t('Medicine search stops working. To have it again, it must be downloaded with internet.')}
                </span>
                <span className="nv-content-actions">
                  <button type="button" className="nv-primary nv-danger" disabled={sending} onClick={() => post('/remedios/remover')}>
                    {sending ? t('Removing…') : t('Yes, remove')}
                  </button>
                  <button type="button" className="nv-primary nv-secondary" disabled={sending} onClick={() => setConfirming(false)}>
                    {t('Cancel')}
                  </button>
                </span>
              </div>
            ) : (
              <button type="button" className="nv-link-button" onClick={() => setConfirming(true)}>
                {t('Remove from this server')}
              </button>
            )}
          </div>
        </section>
      )}
    </NovoLayout>
  )
}
