import { Head, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import type { ReferenceDocStatus } from '../../../types/fichas'

/** Documento de referência que o servidor ainda não conseguiu baixar. */
export default function NovoReferencia(props: { doc: ReferenceDocStatus }) {
  const { t } = useTranslation()
  const { doc } = props
  return (
    <NovoLayout>
      <Head title={doc.title} />

      <Link href="/fichas" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('First aid')}
      </Link>

      <div className="nv-card">
        <h1 className="nv-tile-label">{doc.title}</h1>
        <span className="nv-text">
          {doc.publisher}, {doc.year}
        </span>
        <p className="nv-text">
          {t('This document has not been downloaded to this server yet. It will be downloaded automatically from the official source when there is internet.')}
        </p>
        <p className="nv-text">
          {t('Official source:')} <span className="nv-url">{doc.url}</span>
        </p>
      </div>
    </NovoLayout>
  )
}
