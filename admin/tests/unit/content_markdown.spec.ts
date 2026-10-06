import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { prepareContentMarkdown } from '../../inertia/novo/contentMarkdown.js'

test('notas viram links numerados na ordem em que aparecem; marcador de aviso sai', () => {
  const { markdown, order } = prepareContentMarkdown('Potência de 0,5 W.[^pot] Canais.[^can] De novo.[^pot]\n\n> [!ATENCAO]\n> Emergência primeiro.')
  assert.equal(markdown, 'Potência de 0,5 W.[1](#fonte-pot) Canais.[2](#fonte-can) De novo.[1](#fonte-pot)\n\n> Emergência primeiro.')
  assert.deepEqual(order, ['pot', 'can'])
})
