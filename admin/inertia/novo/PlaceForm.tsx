import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MARKER_ICONS } from '~/components/maps/marker_icons'
import { PIN_COLORS, type PinColorId } from '~/hooks/useMapMarkers'

export interface PlaceValues {
  name: string
  notes: string | null
  color: PinColorId
  icon: string | null
}

/**
 * Formulário de um lugar no mapa: nome, notas, cor e ícone. Serve para marcar
 * e para editar; os ícones e as cores são os mesmos da interface clássica.
 */
export default function PlaceForm(props: {
  initial?: Partial<PlaceValues>
  saving: boolean
  submitLabel: string
  onSubmit: (values: PlaceValues) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(props.initial?.name ?? '')
  const [notes, setNotes] = useState(props.initial?.notes ?? '')
  const [color, setColor] = useState<PinColorId>(props.initial?.color ?? 'orange')
  const [icon, setIcon] = useState<string | null>(props.initial?.icon ?? null)
  const [showIcons, setShowIcons] = useState(false)
  const chosenIcon = MARKER_ICONS.find((i) => i.name === icon)

  return (
    <form
      className="nv-map-popup nv-place-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) props.onSubmit({ name: name.trim(), notes: notes.trim() || null, color, icon })
      }}
    >
      <label htmlFor="nv-place-name">
        <strong>{t('Name of the place')}</strong>
      </label>
      <input
        id="nv-place-name"
        className="nv-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('E.g.: drinking water, shelter, health post')}
        maxLength={255}
        autoFocus
      />
      <textarea
        className="nv-input nv-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('Notes (optional)')}
        maxLength={500}
        rows={2}
      />

      <fieldset className="nv-place-colors">
        <legend>{t('Color')}</legend>
        {PIN_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === color ? 'nv-swatch nv-swatch-on' : 'nv-swatch'}
            style={{ background: c.hex }}
            aria-label={t(c.label)}
            aria-pressed={c.id === color}
            onClick={() => setColor(c.id)}
          />
        ))}
      </fieldset>

      <button type="button" className="nv-link-button nv-text-button nv-place-icon-toggle" aria-expanded={showIcons} onClick={() => setShowIcons((s) => !s)}>
        {chosenIcon ? (
          <>
            <chosenIcon.Icon size={18} aria-hidden="true" /> {t(chosenIcon.label)}
          </>
        ) : (
          t('Choose an icon')
        )}
      </button>
      {showIcons && (
        <div className="nv-place-icons" role="group" aria-label={t('Icon')}>
          <button type="button" className={icon === null ? 'nv-icon-choice nv-icon-choice-on' : 'nv-icon-choice'} onClick={() => setIcon(null)}>
            {t('None')}
          </button>
          {MARKER_ICONS.map((entry) => (
            <button
              key={entry.name}
              type="button"
              className={entry.name === icon ? 'nv-icon-choice nv-icon-choice-on' : 'nv-icon-choice'}
              title={t(entry.label)}
              aria-label={t(entry.label)}
              aria-pressed={entry.name === icon}
              onClick={() => {
                setIcon(entry.name)
                setShowIcons(false)
              }}
            >
              <entry.Icon size={20} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <span className="nv-content-actions">
        <button type="submit" className="nv-primary nv-app-button" disabled={props.saving || !name.trim()}>
          {props.saving ? t('Saving…') : props.submitLabel}
        </button>
        <button type="button" className="nv-primary nv-secondary nv-app-button" onClick={props.onCancel}>
          {t('Cancel')}
        </button>
      </span>
    </form>
  )
}
