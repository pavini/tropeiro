import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadContent } from '../../app/content/loader.js'
import { parseContent } from '../../app/utils/conteudo.js'
import { validateContent } from '../../app/utils/conteudo_validacao.js'
import type { LoadedContent } from '../../app/content/loader.js'

test('o conteúdo do repositório passa na validação', () => {
  const problems = validateContent(loadContent())
  assert.deepEqual(problems, [], problems.map((p) => `${p.file}: ${p.message}`).join('\n'))
})

const base = (body: string, extra = ''): LoadedContent => {
  const text = `---
titulo: Teste
tema: radio
tipo: guia
resumo: Teste.
palavras-chave: [teste]
revisao: { revisado: false }
autores: [Alguém]
atualizado: 2026-10-06
${extra}---

${body}
`
  const { item, problems } = parseContent(text, 'radio/teste.md')
  assert.deepEqual(problems, [])
  return {
    dir: '',
    themes: [{ id: 'radio', title: 'Rádio', description: '' }],
    sources: [
      { id: 'norma', title: 'Norma', publisher: 'Anatel', year: 2026, theme: 'radio', audience: 'public', format: 'html', url: 'https://x.gov.br/n', sha256: '', sizeBytes: 0, mustContain: ['Art. 1'], license: 'Lei' },
      { id: 'cartilha', title: 'Cartilha', publisher: 'Anatel', year: 2026, theme: 'radio', audience: 'public', url: 'https://x.gov.br/c.pdf', sha256: 'a'.repeat(64), sizeBytes: 10, license: 'Público' },
    ],
    items: [item!],
    fichas: [],
    problems: [],
  }
}

test('fonte que não existe, página em norma HTML e trecho em PDF são apontados', () => {
  const content = base(
    'A.[^a] B.[^b] C.[^c]\n\n[^a]: inexistente, p. 1 — x\n[^b]: norma, p. 3 — y\n[^c]: cartilha, trecho "z" — z'
  )
  const msgs = validateContent(content).map((p) => p.message)
  assert.ok(msgs.some((m) => /documento "inexistente" não está em fontes\.yml/.test(m)))
  assert.ok(msgs.some((m) => /norma é página HTML; cite um trecho exato/.test(m)))
  assert.ok(msgs.some((m) => /cartilha é PDF; cite a página/.test(m)))
})

test('trecho que não aparece no documento baixado é apontado', () => {
  const content = base('A.[^a]\n\n[^a]: norma, trecho "Art. 99" — x')
  const msgs = validateContent(content, () => 'Art. 1 Fica aprovado...').map((p) => p.message)
  assert.match(msgs.join(), /o trecho "Art\. 99" não aparece em norma/)
})

test('"veja também" para conteúdo que não existe é apontado', () => {
  const content = base('A.[^a]\n\n[^a]: cartilha, p. 2 — x', 'veja-tambem: [radio/nao-existe]\n')
  assert.match(validateContent(content).map((p) => p.message).join(), /"veja-tambem" aponta para "radio\/nao-existe"/)
})
