import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { KITS } from '../../constants/kits.js'

const CATALOG_DIR = new URL('../../../collections/tropeiro/', import.meta.url)
const load = (name: string) => JSON.parse(readFileSync(new URL(name, CATALOG_DIR), 'utf8'))

const wikipedia: { id: string; size_mb: number }[] = load('wikipedia.json').options
const categories: { slug: string; tiers: { slug: string }[] }[] = load('kiwix-categories.json').categories

const wikiSize = (id: string) => wikipedia.find((o) => o.id === id)?.size_mb
const tierRank = (category: string, tier: string) =>
  categories.find((c) => c.slug === category)?.tiers.findIndex((t) => t.slug === tier) ?? -1

test('kits apontam para opções e níveis que existem no catálogo', () => {
  for (const kit of KITS) {
    assert.ok(wikiSize(kit.wikipedia) !== undefined, `${kit.id}: Wikipedia ${kit.wikipedia} não existe`)
    assert.ok(kit.wikipedia.startsWith('pt-'), `${kit.id}: a Wikipedia do kit deve ser em português`)
    for (const ref of kit.tiers) {
      assert.ok(tierRank(ref.category, ref.tier) >= 0, `${kit.id}: ${ref.category}/${ref.tier} não existe`)
    }
    const slugs = kit.tiers.map((r) => r.category)
    assert.equal(new Set(slugs).size, slugs.length, `${kit.id}: categoria repetida`)
  }
})

test('cada kit contém o anterior', () => {
  for (let i = 1; i < KITS.length; i++) {
    const prev = KITS[i - 1]
    const kit = KITS[i]
    assert.ok(wikiSize(kit.wikipedia)! >= wikiSize(prev.wikipedia)!, `${kit.id}: Wikipedia menor que a de ${prev.id}`)
    for (const ref of prev.tiers) {
      const mine = kit.tiers.find((r) => r.category === ref.category)
      assert.ok(mine, `${kit.id}: falta a categoria ${ref.category} que ${prev.id} tem`)
      assert.ok(
        tierRank(mine.category, mine.tier) >= tierRank(ref.category, ref.tier),
        `${kit.id}: nível de ${ref.category} menor que o de ${prev.id}`
      )
    }
    assert.ok(kit.brazilMap || !prev.brazilMap, `${kit.id}: perdeu o mapa que ${prev.id} tem`)
  }
})
