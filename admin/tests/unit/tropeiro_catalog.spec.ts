import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vine from '@vinejs/vine'

import {
  wikipediaOptionsFileSchema,
  wikipediaSpecSchema,
  zimCategoriesSpecSchema,
} from '../../app/validators/curated_collections.js'
import { isManagedWikipediaFile } from '../../app/utils/managed_wikipedia.js'

const CATALOG_DIR = new URL('../../../collections/tropeiro/', import.meta.url)

function load(name: string) {
  return JSON.parse(readFileSync(new URL(name, CATALOG_DIR), 'utf8'))
}

// Ícones que o DynamicIcon do frontend sabe renderizar (inertia/lib/icons.ts).
const iconsSource = readFileSync(new URL('../../inertia/lib/icons.ts', import.meta.url), 'utf8')
const knownIcons = new Set(
  (iconsSource.match(/export const icons = \{([\s\S]*?)\}/)?.[1] ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)
)

test('wikipedia.json do Tropeiro passa nos dois validadores', async () => {
  const data = load('wikipedia.json')
  await vine.validate({ schema: wikipediaSpecSchema, data })
  await vine.validate({ schema: wikipediaOptionsFileSchema, data })
})

test('toda opção de Wikipedia com URL é reconhecida como Wikipedia gerenciada', () => {
  const { options } = load('wikipedia.json')
  const ids = new Set<string>()
  for (const opt of options) {
    assert.ok(!ids.has(opt.id), `id duplicado: ${opt.id}`)
    ids.add(opt.id)
    if (opt.url === null) continue
    assert.equal(isManagedWikipediaFile(opt.url), true, opt.url)
    assert.ok(opt.url.endsWith(`_${opt.version}.zim`), `versão não bate com a URL: ${opt.id}`)
  }
  assert.ok(ids.has('none'))
})

test('kiwix-categories.json do Tropeiro passa no validador', async () => {
  await vine.validate({ schema: zimCategoriesSpecSchema, data: load('kiwix-categories.json') })
})

test('categorias usam ícones existentes, slugs únicos e tiers encadeados', () => {
  const { categories } = load('kiwix-categories.json')
  const slugs = new Set<string>()
  for (const cat of categories) {
    assert.ok(knownIcons.has(cat.icon), `ícone desconhecido em ${cat.slug}: ${cat.icon}`)
    assert.ok(!slugs.has(cat.slug), `slug duplicado: ${cat.slug}`)
    slugs.add(cat.slug)

    const tierSlugs = new Set<string>()
    for (const tier of cat.tiers) {
      if (tier.includesTier) {
        assert.ok(tierSlugs.has(tier.includesTier), `${tier.slug} inclui tier inexistente`)
      }
      tierSlugs.add(tier.slug)
    }
  }
})

test('id e versão de cada recurso batem com o nome do arquivo na URL', () => {
  const { categories } = load('kiwix-categories.json')
  for (const cat of categories) {
    for (const tier of cat.tiers) {
      for (const res of tier.resources) {
        if (res.type === 'dataset') continue
        const filename = res.url.split('/').pop()
        assert.equal(filename, `${res.id}_${res.version}.zim`, `${cat.slug}/${res.id}`)
      }
    }
  }
})

test('ZIMs temáticos de categoria não são confundidos com a Wikipedia geral', () => {
  const { categories } = load('kiwix-categories.json')
  for (const cat of categories) {
    for (const tier of cat.tiers) {
      for (const res of tier.resources) {
        assert.equal(isManagedWikipediaFile(res.url), false, res.id)
      }
    }
  }
})
