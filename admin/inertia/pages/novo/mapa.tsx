import Map, { Marker, NavigationControl, Popup, ScaleControl } from 'react-map-gl/maplibre'
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import { Head, Link } from '@inertiajs/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '~/novo/novo.css'
import { BRAZIL_VIEW, parseCoordinates } from '~/novo/mapStyle'
import { listPlaces, mapLink, parseMapLink, type PlaceSort } from '~/novo/mapPlaces'
import PlaceForm, { type PlaceValues } from '~/novo/PlaceForm'
import MarkerPin from '~/components/maps/MarkerPin'
import { PIN_COLORS, useMapMarkers, type MapMarker } from '~/hooks/useMapMarkers'

const VIEW_KEY = 'tropeiro:mapa-view'
const SCALE_KEY = 'tropeiro:mapa-escala'

type View = { longitude: number; latitude: number; zoom: number }
type ScaleUnit = 'metric' | 'nautical'

function stored<T>(key: string, valid: (v: unknown) => v is T): T | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return valid(value) ? value : null
  } catch {
    return null // sem armazenamento ou valor inválido
  }
}

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // sem armazenamento: só não lembra
  }
}

const isView = (v: unknown): v is View =>
  !!v && typeof v === 'object' && ['longitude', 'latitude', 'zoom'].every((k) => Number.isFinite((v as any)[k]))
const isScale = (v: unknown): v is ScaleUnit => v === 'metric' || v === 'nautical'

interface PlaceHit {
  name: string
  kind: 'city' | 'town' | 'village' | 'neighbourhood'
  latitude: number
  longitude: number
  near: string | null
}

/** O que a busca achou: um lugar do mapa ou coordenadas digitadas. */
type Found = { name: string; latitude: number; longitude: number; coords: boolean }

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

const coords = (latitude: number, longitude: number) => `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`

/**
 * Mapa offline em português, em tela cheia, com os lugares marcados (os mesmos
 * da interface clássica). Os controles flutuam sobre o mapa.
 */
export default function NovoMapa(props: { ready: boolean; regions: string[] }) {
  const { t } = useTranslation()
  const mapRef = useRef<MapRef>(null)
  const [styleError, setStyleError] = useState(false)
  const [link] = useState(() => parseMapLink(window.location.search))
  const [initialView] = useState<View>(
    () => (link ? { longitude: link.longitude, latitude: link.latitude, zoom: link.zoom } : null) ?? stored(VIEW_KEY, isView) ?? BRAZIL_VIEW
  )
  const [scale, setScale] = useState<ScaleUnit>(() => stored(SCALE_KEY, isScale) ?? 'metric')
  const { markers, addMarker, updateMarker, deleteMarker } = useMapMarkers()

  const [marking, setMarking] = useState(false)
  const [draft, setDraft] = useState<{ longitude: number; latitude: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(link?.placeId ?? null)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [shared, setShared] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<PlaceHit[]>([])
  const [hitsOpen, setHitsOpen] = useState(false)
  const [activeHit, setActiveHit] = useState(0)
  const [notFound, setNotFound] = useState(false)
  const [found, setFound] = useState<Found | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [listQuery, setListQuery] = useState('')
  const [listSort, setListSort] = useState<PlaceSort>('name')
  const [showHidden, setShowHidden] = useState(false)
  const [hideNotice, setHideNotice] = useState(false)
  const [pointer, setPointer] = useState<{ latitude: number; longitude: number } | null>(null)
  const [center, setCenter] = useState({ latitude: initialView.latitude, longitude: initialView.longitude })

  const selected = markers.find((m) => m.id === selectedId) ?? null

  useEffect(() => {
    const protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return () => maplibregl.removeProtocol('pmtiles')
  }, [])

  const flyTo = (longitude: number, latitude: number, zoom = 13) =>
    mapRef.current?.flyTo({ center: [longitude, latitude], zoom, duration: 1200 })

  const select = (marker: MapMarker | null) => {
    setSelectedId(marker?.id ?? null)
    setEditing(false)
    setConfirmDelete(false)
    setShared(null)
  }

  const startDraft = (longitude: number, latitude: number) => {
    select(null)
    setDraft({ longitude, latitude })
  }

  const onMapClick = (e: MapLayerMouseEvent) => {
    if (marking) startDraft(e.lngLat.lng, e.lngLat.lat)
  }

  const saveDraft = async (values: PlaceValues) => {
    if (!draft) return
    setSaving(true)
    const marker = await addMarker({ ...draft, ...values })
    setSaving(false)
    if (marker) {
      setDraft(null)
      setMarking(false)
      setFound(null)
      select(marker)
    }
  }

  const saveEdit = async (values: PlaceValues) => {
    if (!selected) return
    setSaving(true)
    await updateMarker(selected.id, values)
    setSaving(false)
    setEditing(false)
  }

  /** Copia o link do lugar; sem área de transferência (rede local sem https), mostra o link para copiar à mão. */
  const share = async (marker: MapMarker) => {
    const url = mapLink(window.location.origin, marker)
    try {
      await navigator.clipboard.writeText(url)
      setShared('copied')
    } catch {
      setShared(url)
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
    setFound({ name: place.name, latitude: place.latitude, longitude: place.longitude, coords: false })
    flyTo(place.longitude, place.latitude, PLACE_ZOOM[place.kind])
  }

  const search = async () => {
    const typed = parseCoordinates(query)
    if (typed) {
      setHitsOpen(false)
      setFound({ name: coords(typed.latitude, typed.longitude), ...typed, coords: true })
      return flyTo(typed.longitude, typed.latitude, 15)
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
  const hiddenCount = markers.length - visible.length
  const listed = useMemo(
    () => listPlaces(markers, { query: listQuery, sort: listSort, showHidden }),
    [markers, listQuery, listSort, showHidden]
  )
  const unavailable = !props.ready || styleError
  const shownCoords = pointer ?? center

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
          onMouseMove={(e) => setPointer({ latitude: e.lngLat.lat, longitude: e.lngLat.lng })}
          onMouseOut={() => setPointer(null)}
          onMoveEnd={(e) => {
            const { longitude, latitude, zoom } = e.viewState
            setCenter({ latitude, longitude })
            store(VIEW_KEY, { longitude, latitude, zoom })
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <ScaleControl position="bottom-right" unit={scale} />

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
                select(marker)
              }}
            >
              <span role="img" aria-label={marker.name}>
                <MarkerPin color={marker.color} customColor={marker.customColor} icon={marker.icon} iconColor={marker.iconColor} active={marker.id === selectedId} />
              </span>
            </Marker>
          ))}

          {selected && (
            <Popup longitude={selected.longitude} latitude={selected.latitude} anchor="top" onClose={() => select(null)} closeOnClick={false} maxWidth="320px">
              {editing ? (
                <PlaceForm
                  initial={{ name: selected.name, notes: selected.notes ?? null, color: selected.color, icon: selected.icon ?? null }}
                  saving={saving}
                  submitLabel={t('Save changes')}
                  onSubmit={(values) => void saveEdit(values)}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <div className="nv-map-popup">
                  <strong>{selected.name}</strong>
                  {!selected.visible && <span className="nv-badge nv-badge-warn">{t('Hidden')}</span>}
                  {selected.notes && <span>{selected.notes}</span>}
                  <span className="nv-map-popup-coords">{coords(selected.latitude, selected.longitude)}</span>
                  {shared === 'copied' && <span className="nv-text">{t('Link copied.')}</span>}
                  {shared && shared !== 'copied' && (
                    <input className="nv-input nv-map-link" readOnly value={shared} aria-label={t('Link to this place')} onFocus={(e) => e.target.select()} autoFocus />
                  )}
                  {confirmDelete ? (
                    <span className="nv-content-actions">
                      <button
                        type="button"
                        className="nv-primary nv-danger nv-app-button"
                        onClick={async () => {
                          await deleteMarker(selected.id)
                          select(null)
                        }}
                      >
                        {t('Yes, delete')}
                      </button>
                      <button type="button" className="nv-primary nv-secondary nv-app-button" onClick={() => setConfirmDelete(false)}>
                        {t('Cancel')}
                      </button>
                    </span>
                  ) : (
                    <span className="nv-map-popup-actions">
                      <button type="button" className="nv-link-button nv-text-button" onClick={() => setEditing(true)}>
                        {t('Edit')}
                      </button>
                      <button type="button" className="nv-link-button nv-text-button" onClick={() => void updateMarker(selected.id, { visible: !selected.visible })}>
                        {selected.visible ? t('Hide') : t('Show')}
                      </button>
                      <button type="button" className="nv-link-button nv-text-button" onClick={() => void share(selected)}>
                        {t('Copy link')}
                      </button>
                      <button type="button" className="nv-link-button nv-danger-text" onClick={() => setConfirmDelete(true)}>
                        {t('Delete place')}
                      </button>
                    </span>
                  )}
                </div>
              )}
            </Popup>
          )}

          {draft && (
            <Popup longitude={draft.longitude} latitude={draft.latitude} anchor="top" onClose={() => setDraft(null)} closeOnClick={false} maxWidth="320px">
              <PlaceForm saving={saving} submitLabel={t('Save place')} onSubmit={(values) => void saveDraft(values)} onCancel={() => setDraft(null)} />
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
        {found && !draft && (
          <span className="nv-map-toast nv-map-toast-link">
            <button type="button" className="nv-map-toast-action" onClick={() => startDraft(found.longitude, found.latitude)}>
              {found.coords ? t('Mark this point') : t('Mark a place at {{name}}', { name: found.name })}
            </button>
            <button type="button" aria-label={t('Close')} onClick={() => setFound(null)}>
              ×
            </button>
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

      <div className="nv-map-status">
        <span className="nv-map-coords" title={pointer ? t('Coordinates under the cursor') : t('Coordinates of the map center')}>
          {coords(shownCoords.latitude, shownCoords.longitude)}
        </span>
        <span className="nv-map-scale" role="group" aria-label={t('Scale unit')}>
          {(['metric', 'nautical'] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              aria-pressed={scale === unit}
              className={scale === unit ? 'nv-map-scale-on' : ''}
              onClick={() => {
                setScale(unit)
                store(SCALE_KEY, unit)
              }}
            >
              {unit === 'metric' ? 'km' : t('nmi')}
            </button>
          ))}
        </span>
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
          {markers.length === 0 ? (
            <p className="nv-text">{t('No places marked yet. Mark water, shelters and health posts so everyone can find them.')}</p>
          ) : (
            <>
              <div className="nv-map-list-tools">
                <input
                  className="nv-input"
                  type="search"
                  value={listQuery}
                  onChange={(e) => setListQuery(e.target.value)}
                  placeholder={t('Find a marked place')}
                  aria-label={t('Find a marked place')}
                />
                <select className="nv-select" value={listSort} onChange={(e) => setListSort(e.target.value as PlaceSort)} aria-label={t('Order')}>
                  <option value="name">{t('By name')}</option>
                  <option value="recent">{t('Most recent first')}</option>
                </select>
                {hiddenCount > 0 && (
                  <label className="nv-ask-option">
                    <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
                    <span>{t('Show hidden ({{count}})', { count: hiddenCount })}</span>
                  </label>
                )}
              </div>
              {listed.length === 0 ? (
                <p className="nv-text">
                  {!listQuery.trim() && !showHidden && hiddenCount > 0
                    ? t('All marked places are hidden. Check “Show hidden” to see them.')
                    : t('No marked place matches.')}
                </p>
              ) : (
                <ul className="nv-content-list">
                  {listed.map((marker) => (
                    <li key={marker.id} className="nv-map-place-row">
                      <button
                        type="button"
                        className={`nv-card nv-card-link nv-map-place${marker.visible ? '' : ' nv-map-place-hidden'}`}
                        onClick={() => {
                          if (!marker.visible) void updateMarker(marker.id, { visible: true })
                          select(marker)
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
                      <button
                        type="button"
                        className="nv-link-button nv-text-button"
                        onClick={() => void updateMarker(marker.id, { visible: !marker.visible })}
                      >
                        {marker.visible ? t('Hide') : t('Show')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
