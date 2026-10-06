import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPlaceIndex, normalizeName, searchPlaces, type Place } from '../../app/utils/place_index.js'

const place = (name: string, kind: Place['kind'], latitude: number, longitude: number, population = 0): Place => ({
  name,
  kind,
  latitude,
  longitude,
  population,
})

const index = buildPlaceIndex([
  place('Florianópolis', 'city', -27.59, -48.55, 537211),
  place('São José', 'city', -27.61, -48.63, 270299),
  place('São Paulo', 'city', -23.55, -46.63, 11450000),
  place('São José dos Campos', 'city', -23.18, -45.88, 697000),
  place('São José', 'neighbourhood', -23.6, -46.7),
  place('Pirenópolis', 'town', -15.85, -48.96, 23000),
  place('Lençóis', 'town', -12.56, -41.39, 11000),
  // repetido em outro bloco do mapa
  place('Lençóis', 'town', -12.561, -41.391, 11000),
])

test('normaliza acento, maiúscula e pontuação', () => {
  assert.equal(normalizeName('São José-dos  Campos'), 'sao jose dos campos')
})

test('acha sem acento e pelo começo do nome', () => {
  assert.deepEqual(searchPlaces(index, 'pirenop').map((p) => p.name), ['Pirenópolis'])
  assert.deepEqual(searchPlaces(index, 'lencois').map((p) => p.name), ['Lençóis'])
})

test('nome igual vem antes; cidade antes de bairro', () => {
  const names = searchPlaces(index, 'sao jose').map((p) => `${p.name}/${p.kind}`)
  assert.deepEqual(names, ['São José/city', 'São José/neighbourhood', 'São José dos Campos/city'])
})

test('cidades repetidas se diferenciam pela cidade maior mais próxima', () => {
  const [city, bairro] = searchPlaces(index, 'são josé')
  assert.equal(city.near, 'Florianópolis')
  assert.equal(bairro.near, 'São Paulo')
})

test('menos de duas letras não busca', () => {
  assert.deepEqual(searchPlaces(index, 's'), [])
})
