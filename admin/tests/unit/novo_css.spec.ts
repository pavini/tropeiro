import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import postcss from 'postcss'

// Um "}" a menos derruba todo o estilo da interface nova (já aconteceu numa
// resolução de conflito, porque PRs diferentes acrescentam no fim do arquivo).
test('novo.css é CSS válido', () => {
  const css = readFileSync(new URL('../../inertia/novo/novo.css', import.meta.url), 'utf8')
  assert.doesNotThrow(() => postcss.parse(css))
})
