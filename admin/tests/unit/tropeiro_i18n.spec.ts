import * as assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const ADMIN_DIR = fileURLToPath(new URL('../../', import.meta.url))
const INERTIA_DIR = join(ADMIN_DIR, 'inertia')
const SEEDERS_DIR = join(ADMIN_DIR, 'database/seeders')

const ptBR: Record<string, string> = JSON.parse(
  readFileSync(join(INERTIA_DIR, 'i18n/locales/pt-BR.json'), 'utf8')
)

function sources(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
}

const frontend = sources(INERTIA_DIR)
// Nomes e descrições dos serviços vêm do banco e são traduzidos na tela.
const seeders = sources(SEEDERS_DIR)

// Sufixos de plural do i18next. Em pt-BR o Intl.PluralRules usa one (0 e 1),
// many (milhões) e other; _zero é opcional e vale só para count === 0.
const PLURAL_SUFFIXES = ['_zero', '_one', '_many', '_other']
const REQUIRED_PLURALS = ['_one', '_many', '_other']

/** Chaves literais em `t('...')`, `t("...")` e `<Trans i18nKey="...">`. */
function usedKeys(): Map<string, { plural: boolean }> {
  const keys = new Map<string, { plural: boolean }>()
  const call = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1\s*(,\s*\{[^}'"`]*\bcount\b)?/g
  const trans = /\bi18nKey=(['"])((?:(?!\1).)*)\1/g
  for (const src of frontend) {
    for (const m of src.matchAll(call)) {
      keys.set(m[2].replace(/\\(.)/g, '$1'), { plural: Boolean(m[3]) })
    }
    for (const m of src.matchAll(trans)) keys.set(m[2], { plural: false })
  }
  return keys
}

test('toda chave usada tem tradução em pt-BR', () => {
  const missing: string[] = []
  for (const [key, { plural }] of usedKeys()) {
    if (plural) {
      for (const suffix of REQUIRED_PLURALS) if (!(key + suffix in ptBR)) missing.push(key + suffix)
    } else if (!(key in ptBR)) {
      missing.push(key)
    }
  }
  assert.deepEqual(missing, [])
})

test('toda chave do pt-BR.json aparece no código', () => {
  const all = [...frontend, ...seeders].join('\n')
  const quoted = (k: string) =>
    [`'${k.replace(/'/g, "\\'")}'`, `"${k.replace(/"/g, '\\"')}"`, `\`${k}\``].some((q) =>
      all.includes(q)
    )
  const base = (k: string) => {
    const suffix = PLURAL_SUFFIXES.find((s) => k.endsWith(s))
    return suffix ? k.slice(0, -suffix.length) : k
  }
  const unused = Object.keys(ptBR).filter((k) => !quoted(base(k)))
  assert.deepEqual(unused, [])
})

const isSingularForm = (k: string) => k.endsWith('_one') || k.endsWith('_zero')

test('traduções não estão vazias e mantêm as interpolações', () => {
  for (const [key, value] of Object.entries(ptBR)) {
    assert.ok(value.trim(), `tradução vazia: ${key}`)
    const vars = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort()
    // No plural de um item só, a tradução pode omitir o {{count}} ("Um arquivo").
    const expected = vars(key).filter((v) => !(isSingularForm(key) && v.includes('count')))
    const got = vars(value).filter((v) => !(isSingularForm(key) && v.includes('count')))
    assert.deepEqual(got, expected, `interpolação diferente: ${key}`)
  }
})
