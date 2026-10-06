import Map, { Marker, NavigationControl, Popup, ScaleControl } from 'react-map-gl/maplibre'
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { Head, Link } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '~/novo/novo.css'
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

interface PlaceHit {
  name: string
  kind: 'city' | 'town' | 'village' | 'neighbourhood'
  latitude: number
  longitude: number
  near: string | null
}

const PLACE_KIND: Record<PlaceHit['kind'], string> = {
  city: 'City',
  town: 'Town',
  village: 'Village',
  neighbourhood: 'Neighbourhood',
}

/** Zoom ao chegar no lugar: cidade grande mostra mais área que um bairro. */
const PLACE_ZOOM: Record<PlaceHit['kind'], number> = { city: 11, town: 13, village: 14, neighbourhood: 14 }

const pinColor = (marker: MapMarker) =>
  marker.customColor || PIN_COLORS.find((c) => c.id === marker.color)?.hex || PIN_COLORS[0].hex

/**
 * Mapa offline em português, em tela cheia, com os lugares marcados (os mesmos
 * da interface clássica). Os controles flutuam sobre o mapa.
 */
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
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<PlaceHit[]>([])
  const [hitsOpen, setHitsOpen] = useState(false)
  const [activeHit, setActiveHit] = useState(0)
  const [notFound, setNotFound] = useState(false)
  const [found, setFound] = useState<PlaceHit | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [hideNotice, setHideNotice] = useState(false)

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

  // Sugestões de lugares enquanto digita (coordenadas não precisam).
  useEffect(() => {
    const text = query.trim()
    if (text.length < 2 || parseCoordinates(text)) {
      setHits([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/mapa/lugares?q=${encodeURIComponent(text)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : []))
        .then((places: PlaceHit[]) => {
          setHits(places)
          setActiveHit(0)
        })
        .catch(() => {})
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const goToPlace = (place: PlaceHit) => {
    setQuery(place.name)
    setHitsOpen(false)
    setFound(place)
    flyTo(place.longitude, place.latitude, PLACE_ZOOM[place.kind])
  }

  const search = async () => {
    const coords = parseCoordinates(query)
    if (coords) {
      setFound(null)
      setHitsOpen(false)
      return flyTo(coords.longitude, coords.latitude)
    }
    let places = hits
    if (places.length === 0 && query.trim().length >= 2) {
      places = await fetch(`/mapa/lugares?q=${encodeURIComponent(query.trim())}`)
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => [])
    }
    const place = places[activeHit] ?? places[0]
    if (place) goToPlace(place)
    else setNotFound(true)
  }

  const describe = (place: PlaceHit) =>
    place.near ? t('{{kind}} · near {{city}}', { kind: t(PLACE_KIND[place.kind]), city: place.near }) : t(PLACE_KIND[place.kind])

  const visible = markers.filter((m) => m.visible)
  const unavailable = !props.ready || styleError

  const back = (
    <Link href="/" className="nv-map-fab nv-map-back" aria-label={t('Home')}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5 L8 12 L15 19" />
      </svg>
      <span>{t('Home')}</span>
    </Link>
  )

  if (unavailable) {
    return (
      <div className="nv nv-map-page nv-map-page-empty">
        <Head title={t('Map')} />
        <div className="nv-map-topbar">{back}</div>
        <div className="nv-card nv-card-error nv-map-empty" role="alert">
          <span className="nv-tile-label">{t('The map is not available on this server')}</span>
          <span className="nv-text">{t('The map files are missing. Whoever manages the server can download them with internet.')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`nv nv-map-page${marking ? ' nv-map-marking' : ''}`}>
      <Head title={t('Map')} />

      <div className="nv-map-canvas">
      <Map
        mapLib={maplibregl}
        mapStyle={`${window.location.origin}/mapa/estilo`}
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
        <ScaleControl position="bottom-right" unit="metric" />

        {found && (
          <Marker longitude={found.longitude} latitude={found.latitude} anchor="center">
            <span className="nv-map-found" role="img" aria-label={found.name} />
          </Marker>
        )}

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

      <div className="nv-map-topbar">
        {back}
        <div className="nv-map-searchbox">
          <form
            className="nv-map-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              void search()
            }}
          >
            <label htmlFor="nv-map-query" className="nv-sr-only">
              {t('Search the map')}
            </label>
            <input
              id="nv-map-query"
              className="nv-input"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHitsOpen(true)
                setNotFound(false)
              }}
              onFocus={() => setHitsOpen(true)}
              onBlur={() => setTimeout(() => setHitsOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveHit((i) => Math.min(i + 1, hits.length - 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveHit((i) => Math.max(i - 1, 0))
                } else if (e.key === 'Escape') {
                  setHitsOpen(false)
                }
              }}
              placeholder={t('City, neighbourhood or coordinates')}
              autoComplete="off"
              role="combobox"
              aria-expanded={hitsOpen && hits.length > 0}
              aria-controls="nv-map-hits"
              aria-autocomplete="list"
            />
            <button type="submit" className="nv-map-go">
              {t('Go')}
            </button>
          </form>
          {hitsOpen && hits.length > 0 && (
            <ul id="nv-map-hits" className="nv-map-hits" role="listbox" aria-label={t('Places found')}>
              {hits.map((place, i) => (
                <li key={`${place.name}-${place.latitude}-${place.longitude}`} role="option" aria-selected={i === activeHit}>
                  <button
                    type="button"
                    className={i === activeHit ? 'nv-map-hit nv-map-hit-active' : 'nv-map-hit'}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToPlace(place)}
                  >
                    <strong>{place.name}</strong>
                    <span>{describe(place)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="nv-map-notices">
        {notFound && (
          <span className="nv-map-toast nv-map-toast-error">
            {t('No place with that name on this map. You can also type coordinates, e.g. -23.55, -46.63')}
          </span>
        )}
        {marking && <span className="nv-map-toast">{t('Tap the map where the place is.')}</span>}
        {props.regions.length === 0 && !hideNotice && (
          <span className="nv-map-toast nv-map-toast-link">
            <Link href="/montar">{t('Only the world overview is on this server. Download the map of Brazil in a kit to see streets and cities.')}</Link>
            <button type="button" aria-label={t('Close')} onClick={() => setHideNotice(true)}>
              ×
            </button>
          </span>
        )}
      </div>

      <div className="nv-map-bottombar">
        <button
          type="button"
          className={`nv-map-fab${marking ? ' nv-map-fab-active' : ''}`}
          aria-pressed={marking}
          onClick={() => {
            setMarking((m) => !m)
            setDraft(null)
            setListOpen(false)
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {marking ? <path d="M6 6 L18 18 M18 6 L6 18" /> : <path d="M12 21 C12 21 19 13.5 19 9 A7 7 0 0 0 5 9 C5 13.5 12 21 12 21 Z M12 6.5 V11.5 M9.5 9 H14.5" />}
          </svg>
          {marking ? t('Cancel marking') : t('Mark a place')}
        </button>
        <button
          type="button"
          className={`nv-map-fab${listOpen ? ' nv-map-fab-active' : ''}`}
          aria-expanded={listOpen}
          aria-controls="nv-map-places"
          onClick={() => setListOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6 H20 M9 12 H20 M9 18 H20 M4.5 6 H4.51 M4.5 12 H4.51 M4.5 18 H4.51" />
          </svg>
          {t('Places ({{count}})', { count: visible.length })}
        </button>
      </div>

      {listOpen && (
        <section id="nv-map-places" className="nv-map-sheet" aria-label={t('Marked places')}>
          <div className="nv-map-sheet-head">
            <h2 className="nv-section-label">{t('Marked places')}</h2>
            <button type="button" className="nv-map-sheet-close" aria-label={t('Close')} onClick={() => setListOpen(false)}>
              ×
            </button>
          </div>
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
                      setListOpen(false)
                      flyTo(marker.longitude, marker.latitude, 15)
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
      )}
    </div>
  )
}
