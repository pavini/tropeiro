import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { localizeLabels } from '../../app/utils/map_labels.js'
import { parseCoordinates } from '../../inertia/novo/mapStyle.js'

test('nomes do mapa passam para o idioma pedido, com reserva', () => {
  const style = {
    layers: [
      { id: 'places_country', layout: { 'text-field': ['format', ['coalesce', ['get', 'name:en'], ['get', 'name:en']], {}] } },
      { id: 'address_label', layout: { 'text-field': ['get', 'addr_housenumber'] } },
    ],
  }
  const out = localizeLabels(style, 'pt')
  const pt = ['coalesce', ['get', 'name:pt'], ['get', 'name:en'], ['get', 'name']]
  assert.deepEqual(out.layers[0].layout['text-field'], ['format', ['coalesce', pt, pt], {}])
  assert.deepEqual(out.layers[1].layout['text-field'], ['get', 'addr_housenumber'])
})

test('não altera o estilo original', () => {
  const style = { a: ['get', 'name:en'] }
  localizeLabels(style, 'pt')
  assert.deepEqual(style, { a: ['get', 'name:en'] })
})

test('lê coordenadas com vírgula ou espaço', () => {
  assert.deepEqual(parseCoordinates('-23.55, -46.63'), { latitude: -23.55, longitude: -46.63 })
  assert.deepEqual(parseCoordinates('-23.55 -46.63'), { latitude: -23.55, longitude: -46.63 })
  assert.equal(parseCoordinates('-23.55'), null)
  assert.equal(parseCoordinates('95, 10'), null)
  assert.equal(parseCoordinates('abc, 10'), null)
})
