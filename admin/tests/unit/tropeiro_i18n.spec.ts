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

/** Primeiro argumento literal de cada chamada `t('...')` / `t("...")`. */
function usedKeys(): Set<string> {
  const keys = new Set<string>()
  const call = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g
  for (const src of frontend) {
    for (const m of src.matchAll(call)) keys.add(m[2].replace(/\\(.)/g, '$1'))
  }
  return keys
}

test('toda chave usada com t() tem tradução em pt-BR', () => {
  const missing = [...usedKeys()].filter((k) => !(k in ptBR))
  assert.deepEqual(missing, [])
})

test('toda chave do pt-BR.json aparece no código', () => {
  const all = [...frontend, ...seeders].join('\n')
  const quoted = (k: string) =>
    [`'${k.replace(/'/g, "\\'")}'`, `"${k.replace(/"/g, '\\"')}"`, `\`${k}\``].some((q) =>
      all.includes(q)
    )
  const unused = Object.keys(ptBR).filter((k) => !quoted(k))
  assert.deepEqual(unused, [])
})

test('traduções não estão vazias e mantêm as interpolações', () => {
  for (const [key, value] of Object.entries(ptBR)) {
    assert.ok(value.trim(), `tradução vazia: ${key}`)
    const vars = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort()
    assert.deepEqual(vars(value), vars(key), `interpolação diferente: ${key}`)
  }
})
