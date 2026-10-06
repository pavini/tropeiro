import { Head, Link, router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'

type Status = 'article' | 'not_found' | 'unavailable' | 'not_installed'

/** Artigo da biblioteca lido dentro do Tropeiro. */
export default function NovoLer(props: {
  q: string
  status: Status
  article: { title: string; html: string } | null
}) {
  const { t } = useTranslation()
  const back = props.q
    ? { href: `/novo/busca?q=${encodeURIComponent(props.q)}`, label: t('Results') }
    : { href: '/novo', label: t('Home') }

  // Links para outros artigos navegam sem recarregar a página.
  const onArticleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = (e.target as HTMLElement).closest('a')
    const href = link?.getAttribute('href')
    if (!href || link?.target === '_blank' || !href.startsWith('/novo/ler/')) return
    e.preventDefault()
    router.visit(href)
  }

  return (
    <NovoLayout>
      <Head title={props.article?.title || t('Library')} />

      <Link href={back.href} className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {back.label}
      </Link>

      {props.article ? (
        <article className="nv-reading">
          <h1 className="nv-title">{props.article.title}</h1>
          {/* HTML já sanitizado no servidor (app/utils/kiwix_article.ts). */}
          <div
            className="nv-article"
            onClick={onArticleClick}
            dangerouslySetInnerHTML={{ __html: props.article.html }}
          />
        </article>
      ) : (
        <div className="nv-card">
          <h1 className="nv-tile-label">
            {props.status === 'not_found'
              ? t('Page not found')
              : props.status === 'not_installed'
                ? t('No library on this server yet')
                : t('The library did not respond')}
          </h1>
          <p className="nv-text">
            {props.status === 'not_found'
              ? t('This page is not in the library. Try searching for the subject.')
              : props.status === 'not_installed'
                ? t('Whoever manages the server can install the library and choose content in the classic interface.')
                : t('The search could not reach the library. Whoever manages the server can check whether it is running.')}
          </p>
        </div>
      )}
    </NovoLayout>
  )
}
