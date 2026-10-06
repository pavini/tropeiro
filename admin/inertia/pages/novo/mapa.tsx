import Map, { Marker, NavigationControl, Popup, ScaleControl } from 'react-map-gl/maplibre'
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { Head, Link } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NovoLayout from '~/novo/NovoLayout'
import { BRAZIL_VIEW, parseCoordinates } from '~/novo/mapStyle'
import { PIN_COLORS, useMapMarkers, type MapMarker } from '~/hooks/useMapMarkers'

const VIEW_KEY = 'tropeiro:mapa-view'

type View = { longitude: number; latitude: number; zoom: number }

function savedView(): View | null {
  try {
    const view = JSON.parse(localStorage.getItem(VIEW_KEY) ?? 'null')
    if (view && [view.longitude, view.latitude, view.zoom].every(Number.isFinite)) return view
  } catch {
    // sem armazenamento ou valor inválido: abre no Brasil
  }
  return null
}

const pinColor = (marker: MapMarker) =>
  marker.customColor || PIN_COLORS.find((c) => c.id === marker.color)?.hex || PIN_COLORS[0].hex

/** Mapa offline em português, com os pontos marcados (os mesmos da interface clássica). */
export default function NovoMapa(props: { ready: boolean; regions: string[] }) {
  const { t } = useTranslation()
  const mapRef = useRef<MapRef>(null)
  const [styleError, setStyleError] = useState(false)
  const [initialView] = useState<View>(() => savedView() ?? BRAZIL_VIEW)
  const { markers, addMarker, deleteMarker } = useMapMarkers()

  const [marking, setMarking] = useState(false)
  const [draft, setDraft] = useState<{ longitude: number; latitude: number } | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<MapMarker | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [coords, setCoords] = useState('')
  const [coordsError, setCoordsError] = useState(false)

  useEffect(() => {
    const protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return () => maplibregl.removeProtocol('pmtiles')
  }, [])

  const flyTo = (longitude: number, latitude: number, zoom = 13) =>
    mapRef.current?.flyTo({ center: [longitude, latitude], zoom, duration: 1200 })

  const onMapClick = (e: MapLayerMouseEvent) => {
    if (!marking) return
    setSelected(null)
    setDraft({ longitude: e.lngLat.lng, latitude: e.lngLat.lat })
    setDraftName('')
    setDraftNotes('')
  }

  const saveDraft = async () => {
    if (!draft || !draftName.trim()) return
    setSaving(true)
    const marker = await addMarker({ ...draft, name: draftName.trim(), notes: draftNotes.trim() || null })
    setSaving(false)
    if (marker) {
      setDraft(null)
      setMarking(false)
    }
  }

  const goToCoordinates = () => {
    const parsed = parseCoordinates(coords)
    setCoordsError(!parsed)
    if (parsed) flyTo(parsed.longitude, parsed.latitude)
  }

  const visible = markers.filter((m) => m.visible)
  const unavailable = !props.ready || styleError

  return (
    <NovoLayout>
      <Head title={t('Map')} />

      <Link href="/novo" className="nv-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5 L8 12 L15 19" />
        </svg>
        {t('Home')}
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="nv-title">{t('Map')}</h1>
        <p className="nv-text">
          {props.regions.length > 0
            ? t('Detailed map of: {{regions}}. Works without internet.', { regions: props.regions.join(', ') })
            : t('Works without internet.')}
        </p>
      </div>

      {unavailable ? (
        <div className="nv-card nv-card-error" role="alert">
          <span className="nv-tile-label">{t('The map is not available on this server')}</span>
          <span className="nv-text">{t('The map files are missing. Whoever manages the server can download them with internet.')}</span>
        </div>
      ) : (
        props.regions.length === 0 && (
          <Link href="/novo/montar" className="nv-card nv-card-link">
            <span className="nv-tile-label">{t('Only the world overview is on this server')}</span>
            <span className="nv-text">{t('To see streets and cities, download the map of Brazil in one of the kits.')}</span>
          </Link>
        )
      )}

      {!unavailable && (
        <>
          <div className="nv-map-tools">
            <button
              type="button"
              className={`nv-primary nv-app-button ${marking ? '' : 'nv-secondary'}`}
              aria-pressed={marking}
              onClick={() => {
                setMarking((m) => !m)
                setDraft(null)
              }}
            >
              {marking ? t('Cancel marking') : t('Mark a place')}
            </button>
            <form
              className="nv-map-coords"
              onSubmit={(e) => {
                e.preventDefault()
                goToCoordinates()
              }}
            >
              <label htmlFor="nv-coords" className="nv-sr-only">
                {t('Coordinates')}
              </label>
              <input
                id="nv-coords"
                className="nv-input"
                value={coords}
                onChange={(e) => {
                  setCoords(e.target.value)
                  setCoordsError(false)
                }}
                placeholder={t('Coordinates, e.g. -23.55, -46.63')}
                inputMode="decimal"
                aria-invalid={coordsError}
              />
              <button type="submit" className="nv-primary nv-secondary nv-app-button">
                {t('Go')}
              </button>
            </form>
          </div>
          {coordsError && <span className="nv-answer-error">{t('Type latitude and longitude, e.g. -23.55, -46.63')}</span>}
          {marking && <p className="nv-text nv-map-hint">{t('Tap the map where the place is.')}</p>}

          <div className={`nv-map${marking ? ' nv-map-marking' : ''}`}>
            <Map
              mapLib={maplibregl}
              mapStyle={`${window.location.origin}/novo/mapa/estilo`}
              initialViewState={initialView}
              style={{ width: '100%', height: '100%' }}
              onClick={onMapClick}
              ref={mapRef}
              onError={(e) => {
                // Sem o estilo não há mapa; erros de um bloco isolado não derrubam a tela.
                if (!e.target.isStyleLoaded()) setStyleError(true)
              }}
              onMoveEnd={(e) => {
                const { longitude, latitude, zoom } = e.viewState
                try {
                  localStorage.setItem(VIEW_KEY, JSON.stringify({ longitude, latitude, zoom }))
                } catch {
                  // sem armazenamento: só não lembra a posição
                }
              }}
            >
              <NavigationControl position="top-right" showCompass={false} />
              <ScaleControl position="bottom-left" unit="metric" />

              {visible.map((marker) => (
                <Marker
                  key={marker.id}
                  longitude={marker.longitude}
                  latitude={marker.latitude}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    setDraft(null)
                    setConfirmDelete(false)
                    setSelected(marker)
                  }}
                >
                  <svg width="30" height="38" viewBox="0 0 30 38" aria-label={marker.name} role="img" style={{ cursor: 'pointer' }}>
                    <path d="M15 37 C15 37 28 22 28 14 A13 13 0 0 0 2 14 C2 22 15 37 15 37 Z" fill={pinColor(marker)} stroke="#ffffff" strokeWidth="2" />
                    <circle cx="15" cy="14" r="4.5" fill="#ffffff" />
                  </svg>
                </Marker>
              ))}

              {selected && (
                <Popup longitude={selected.longitude} latitude={selected.latitude} anchor="top" onClose={() => setSelected(null)} closeOnClick={false} maxWidth="280px">
                  <div className="nv-map-popup">
                    <strong>{selected.name}</strong>
                    {selected.notes && <span>{selected.notes}</span>}
                    <span className="nv-map-popup-coords">
                      {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                    </span>
                    {confirmDelete ? (
                      <span className="nv-content-actions">
                        <button
                          type="button"
                          className="nv-primary nv-danger nv-app-button"
                          onClick={async () => {
                            await deleteMarker(selected.id)
                            setSelected(null)
                          }}
                        >
                          {t('Yes, delete')}
                        </button>
                        <button type="button" className="nv-primary nv-secondary nv-app-button" onClick={() => setConfirmDelete(false)}>
                          {t('Cancel')}
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="nv-link-button" onClick={() => setConfirmDelete(true)}>
                        {t('Delete place')}
                      </button>
                    )}
                  </div>
                </Popup>
              )}

              {draft && (
                <Popup longitude={draft.longitude} latitude={draft.latitude} anchor="top" onClose={() => setDraft(null)} closeOnClick={false} maxWidth="300px">
                  <form
                    className="nv-map-popup"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void saveDraft()
                    }}
                  >
                    <label htmlFor="nv-place-name">
                      <strong>{t('Name of the place')}</strong>
                    </label>
                    <input
                      id="nv-place-name"
                      className="nv-input"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder={t('E.g.: drinking water, shelter, health post')}
                      maxLength={255}
                      autoFocus
                    />
                    <textarea
                      className="nv-input nv-textarea"
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      placeholder={t('Notes (optional)')}
                      maxLength={500}
                      rows={2}
                    />
                    <span className="nv-content-actions">
                      <button type="submit" className="nv-primary nv-app-button" disabled={saving || !draftName.trim()}>
                        {saving ? t('Saving…') : t('Save place')}
                      </button>
                      <button type="button" className="nv-primary nv-secondary nv-app-button" onClick={() => setDraft(null)}>
                        {t('Cancel')}
                      </button>
                    </span>
                  </form>
                </Popup>
              )}
            </Map>
          </div>

          <section className="nv-content-group">
            <h2 className="nv-section-label">{t('Marked places')}</h2>
            {visible.length === 0 ? (
              <p className="nv-text">{t('No places marked yet. Mark water, shelters and health posts so everyone can find them.')}</p>
            ) : (
              <ul className="nv-content-list">
                {visible.map((marker) => (
                  <li key={marker.id}>
                    <button
                      type="button"
                      className="nv-card nv-card-link nv-map-place"
                      onClick={() => {
                        setSelected(marker)
                        setConfirmDelete(false)
                        flyTo(marker.longitude, marker.latitude, 15)
                        mapRef.current?.getContainer().scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                    >
                      <span className="nv-map-dot" style={{ background: pinColor(marker) }} aria-hidden="true" />
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span className="nv-tile-label">{marker.name}</span>
                        {marker.notes && <span className="nv-text">{marker.notes}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </NovoLayout>
  )
}
