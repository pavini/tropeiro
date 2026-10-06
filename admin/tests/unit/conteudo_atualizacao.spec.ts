import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { contentSetHash, gitBlobSha, isContentPath, planUpdate } from '../../app/utils/conteudo_atualizacao.js'

test('impressão igual à do git', () => {
  // `printf 'oi\n' | git hash-object --stdin`
  assert.equal(gitBlobSha(Buffer.from('oi\n')), 'c09fc3cf1b3b73ae5210ed9a224034a409287dd4')
  assert.equal(gitBlobSha(Buffer.from('')), 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391')
})

test('só Markdown e YAML, sem pastas escondidas', () => {
  assert.ok(isContentPath('saude/queimadura.md'))
  assert.ok(isContentPath('fontes.yml'))
  assert.ok(!isContentPath('.github/x.md'))
  assert.ok(!isContentPath('imagens/foto.png'))
})

test('baixa só o que mudou ou entrou; tira o que saiu', () => {
  const remote = [
    { path: 'fontes.yml', sha: 'a', size: 1 },
    { path: 'saude/queimadura.md', sha: 'b2', size: 1 },
    { path: 'radio/novo.md', sha: 'c', size: 1 },
    { path: 'logo.png', sha: 'x', size: 1 },
  ]
  const local = new Map([
    ['fontes.yml', 'a'],
    ['saude/queimadura.md', 'b1'],
    ['saude/removida.md', 'd'],
  ])
  const plan = planUpdate(remote, local)
  assert.deepEqual(plan.download.map((f) => f.path), ['saude/queimadura.md', 'radio/novo.md'])
  assert.deepEqual(plan.keep, ['fontes.yml'])
  assert.deepEqual(plan.remove, ['saude/removida.md'])
})

test('impressão do conjunto não depende da ordem e muda com qualquer arquivo', () => {
  const a = contentSetHash(new Map([['x.md', '1'], ['y.md', '2']]))
  assert.equal(a, contentSetHash(new Map([['y.md', '2'], ['x.md', '1']])))
  assert.notEqual(a, contentSetHash(new Map([['x.md', '1'], ['y.md', '3']])))
  assert.notEqual(a, contentSetHash(new Map([['x.md', '1']])))
})
