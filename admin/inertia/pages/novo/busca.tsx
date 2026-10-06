import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import type { ServiceSlim } from '../../../types/services'
import type { LibraryBookResult, LibrarySearchResult, SnippetPart } from '../../../types/library_search'
import { SERVICE_NAMES } from '../../../constants/service_names'

/** Busca da interface nova: procura em todo o acervo da biblioteca de uma vez. */
export default function NovoBusca(props: {
  q: string
  services: ServiceSlim[]
  library: LibrarySearchResult
  fichas: { slug: string; title: string; summary: string }[]
  conteudos: { id: string; title: string; summary: string }[]
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(props.q)

  const ollama = props.services.some((s) => s.service_name === SERVICE_NAMES.OLLAMA && s.installed)
  const { status, books } = props.library

  return (
    <NovoLayout>
      <Head title={props.q ? t('Search: {{q}}', { q: props.q }) : t('Search')} />

      <Link href="/" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <form
        className="nv-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = query.trim()
          if (trimmed) router.get('/busca', { q: trimmed })
        }}
      >
        <label htmlFor="nv-busca" className="nv-section-label">
          {t('Search')}
        </label>
        <div className="nv-search-row">
          <input
            id="nv-busca"
            type="search"
            className="nv-input"
            value={query}
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

      {props.q && (
        <section className="nv-results" aria-live="polite">
          {props.fichas.length > 0 && (
            <section className="nv-book" aria-labelledby="faca-agora">
              <h2 id="faca-agora" className="nv-section-label">{t('First aid · do it now')}</h2>
              {props.fichas.map((ficha) => (
                <Link key={ficha.slug} href={`/fichas/${ficha.slug}`} className="nv-card nv-card-link nv-card-ficha">
                  <span className="nv-tile-label">{ficha.title}</span>
                  <span className="nv-text">{ficha.summary}</span>
                  <span className="nv-ficha-cta">{t('See step by step')} →</span>
                </Link>
              ))}
            </section>
          )}

          {props.conteudos.length > 0 && (
            <section className="nv-book" aria-labelledby="conteudos">
              <h2 id="conteudos" className="nv-section-label">{t('Tropeiro content')}</h2>
              {props.conteudos.map((c) => (
                <Link key={c.id} href={`/temas/${c.id}`} className="nv-card nv-card-link">
                  <span className="nv-tile-label">{c.title}</span>
                  <span className="nv-text">{c.summary}</span>
                </Link>
              ))}
            </section>
          )}

          {status === 'ok' && books.length > 0 && (
            <>
              <h1 className="nv-title">{t('Results for “{{q}}”', { q: props.q })}</h1>
              {books.map((book) => (
                <BookResults key={book.bookId} book={book} q={props.q} />
              ))}
            </>
          )}

          {status === 'ok' && books.length === 0 && props.fichas.length === 0 && props.conteudos.length === 0 && (
            <div className="nv-card">
              <h1 className="nv-tile-label">{t('Nothing found for “{{q}}”', { q: props.q })}</h1>
              <p className="nv-text">{t('Try a shorter or more common word, or check the spelling.')}</p>
            </div>
          )}

          {status === 'unavailable' && (
            <div className="nv-card">
              <h1 className="nv-tile-label">{t('The library did not respond')}</h1>
              <p className="nv-text">
                {t('The search could not reach the library. Whoever manages the server can check whether it is running.')}
              </p>
            </div>
          )}

          {status === 'not_installed' && (
            <div className="nv-card">
              <h1 className="nv-tile-label">{t('No library on this server yet')}</h1>
              <p className="nv-text">
                {t('Whoever manages the server can install the library and choose content in the classic interface.')}
              </p>
            </div>
          )}

          {ollama && (
            <Link className="nv-card nv-card-link nv-card-ai" href={`/perguntar?q=${encodeURIComponent(props.q)}`}>
              <span className="nv-tile-label">{t('Didn’t find it? Ask the AI')}</span>
              <span className="nv-text">{t('It answers using the content on this server.')}</span>
            </Link>
          )}
        </section>
      )}
    </NovoLayout>
  )
}

/** `/content/livro/Artigo` → leitura dentro do Tropeiro, levando a busca junto. */
function readHref(contentPath: string, q: string): string {
  return `/ler/${contentPath.replace(/^\/content\//, '')}?q=${encodeURIComponent(q)}`
}

function BookResults({ book, q }: { book: LibraryBookResult; q: string }) {
  const { t } = useTranslation()
  return (
    <section className="nv-book" aria-labelledby={`livro-${book.bookId}`}>
      <h2 id={`livro-${book.bookId}`} className="nv-section-label">
        {book.bookTitle}
        <span className="nv-book-count"> · {t('{{count}} results', { count: book.total })}</span>
      </h2>
      {book.hits.map((hit) => {
        const body = (
          <>
            <span className="nv-tile-label">{hit.title}</span>
            {hit.snippet.length > 0 && (
              <span className="nv-text nv-snippet">
                <Snippet parts={hit.snippet} />
              </span>
            )}
          </>
        )
        return (
          <Link key={hit.path} className="nv-card nv-card-link" href={readHref(hit.path, q)}>
            {body}
          </Link>
        )
      })}
    </section>
  )
}

function Snippet({ parts }: { parts: SnippetPart[] }) {
  return (
    <>
      {parts.map((part, i) => (part.bold ? <strong key={i}>{part.text}</strong> : <span key={i}>{part.text}</span>))}
    </>
  )
}
