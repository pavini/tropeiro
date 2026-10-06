import { useTranslation } from 'react-i18next'

/** Telefones de emergência do Brasil, com toque para ligar no celular. */
export default function EmergencyNumbers() {
  const { t } = useTranslation()
  const numbers = [
    { number: '192', label: t('SAMU') },
    { number: '193', label: t('Fire department') },
    { number: '190', label: t('Police') },
  ]
  return (
    <div className="nv-emergency" role="note" aria-label={t('Emergency numbers')}>
      {numbers.map((n) => (
        <a key={n.number} href={`tel:${n.number}`} className="nv-emergency-call">
          <span className="nv-emergency-number">{n.number}</span>
          <span className="nv-emergency-label">{n.label}</span>
        </a>
      ))}
    </div>
  )
}
