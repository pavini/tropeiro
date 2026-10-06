import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseMapFilename } from '../../app/utils/map_filename.js'

test('lê mapas de coleção do catálogo', () => {
  assert.deepEqual(parseMapFilename('pacific_2025-12.pmtiles'), { resource_id: 'pacific', version: '2025-12' })
})

test('lê países recortados (id da região e data do mapa mundial)', () => {
  assert.deepEqual(parseMapFilename('br_20261005_z15.pmtiles'), { resource_id: 'br', version: '20261005' })
  assert.deepEqual(parseMapFilename('br-ar-uy_20261005_z10.pmtiles'), { resource_id: 'br-ar-uy', version: '20261005' })
})

test('ignora o que não é mapa conhecido', () => {
  assert.equal(parseMapFilename('world_basemap.pmtiles'), null)
  assert.equal(parseMapFilename('br.pmtiles'), null)
})
