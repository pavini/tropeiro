import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { listPlaces, mapLink, parseMapLink } from '../../inertia/novo/mapPlaces.js'

test('link direto: latitude, longitude, zoom e lugar', () => {
  assert.deepEqual(parseMapLink('?lat=-23.55&lng=-46.63&zoom=16&lugar=7'), { latitude: -23.55, longitude: -46.63, zoom: 16, placeId: 7 })
  assert.deepEqual(parseMapLink('?lat=-23.55&long=-46.63'), { latitude: -23.55, longitude: -46.63, zoom: 15, placeId: null }, 'long, como o mapa clássico')
})

test('link sem coordenadas válidas não move o mapa', () => {
  assert.equal(parseMapLink(''), null)
  assert.equal(parseMapLink('?lat=-23.55'), null)
  assert.equal(parseMapLink('?lat=abc&lng=-46'), null)
  assert.equal(parseMapLink('?lat=95&lng=-46'), null)
  assert.equal(parseMapLink('?lat=-23&lng=-46&zoom=99')?.zoom, 15, 'zoom fora da faixa volta ao padrão')
})

test('link de um lugar volta igual', () => {
  const url = mapLink('http://tropeiro.local:8080', { latitude: -23.5505199, longitude: -46.6333094, id: 3 })
  assert.equal(url, 'http://tropeiro.local:8080/mapa?lat=-23.550520&lng=-46.633309&zoom=16&lugar=3')
  assert.equal(parseMapLink(new URL(url).search)?.placeId, 3)
})

const p = (name: string, createdAt: string, visible = true, notes: string | null = null) => ({ name, createdAt, visible, notes })
const LUGARES = [p('Poço', '2026-10-01', true, 'água boa'), p('Abrigo da escola', '2026-10-03'), p('Água da mina', '2026-10-02', false)]

test('lista: ocultos só quando pedidos, busca sem acento no nome e nas notas', () => {
  const nomes = (opts: Parameters<typeof listPlaces>[1]) => listPlaces(LUGARES, opts).map((x) => x.name)
  assert.deepEqual(nomes({ query: '', sort: 'name', showHidden: false }), ['Abrigo da escola', 'Poço'])
  assert.deepEqual(nomes({ query: 'agua', sort: 'name', showHidden: true }), ['Água da mina', 'Poço'])
  assert.deepEqual(nomes({ query: '', sort: 'recent', showHidden: true }), ['Abrigo da escola', 'Água da mina', 'Poço'])
})
