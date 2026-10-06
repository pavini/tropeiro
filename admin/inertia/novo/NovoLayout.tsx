import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import './novo.css'
import { Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

/** Marca provisória do Tropeiro: serra com sol. */
export function TropeiroMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <rect width="34" height="34" rx="9" fill="#1E6B47" />
      <path
        d="M8 23 L14 13 L18 19 L21 15 L26 23 Z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="23" cy="10" r="2.2" fill="#F2C14E" />
    </svg>
  )
}

export default function NovoLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="nv">
      <header className="nv-header">
        <Link href="/" className="nv-brand">
          <TropeiroMark />
          Tropeiro
        </Link>
        <span className="nv-pill">
          <span className="nv-pill-dot" />
          {t('Works without internet')}
        </span>
      </header>

      <main className="nv-main">{children}</main>

      <footer className="nv-footer">
        <a href="/home">{t('Advanced administration')}</a>
      </footer>
    </div>
  )
}
