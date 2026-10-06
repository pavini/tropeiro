import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { prepareArticle, readUrl, assetUrl, toContentPath } from '../../app/utils/kiwix_article.js'

const PATH = '/content/wikipedia_pt_top_mini_2026-07/Queimadura'

function page(body: string) {
  return `<!DOCTYPE html><html><head><title>Queimadura</title>
<link rel="stylesheet" href="./_mw_/x.css"><script src="./_webp_/x.js"></script></head>
<body><h1 id="firstHeading"><span>Queimadura</span></h1>
<div id="mw-content-text">${body}</div></body></html>`
}

test('pega o título e só o conteúdo, sem scripts nem estilos', () => {
  const { title, html } = prepareArticle(
    page('<p>Texto<script>alert(1)</script><style>p{}</style></p>'),
    PATH
  )
  assert.equal(title, 'Queimadura')
  assert.equal(html, '<p>Texto</p>')
})

test('remove partes da interface da Wikipedia', () => {
  const { html } = prepareArticle(
    page('<p>Fica</p><div class="navbox">Sai</div><span class="mw-editsection">editar</span>'),
    PATH
  )
  assert.equal(html, '<p>Fica</p>')
})

test('links internos continuam dentro do Tropeiro e levam a busca junto', () => {
  const { html } = prepareArticle(page('<p><a href="Tend%C3%A3o">tendão</a></p>'), PATH, 'queimadura')
  assert.equal(
    html,
    '<p><a href="/ler/wikipedia_pt_top_mini_2026-07/Tend%C3%A3o?q=queimadura">tendão</a></p>'
  )
})

test('âncoras da própria página ficam como estão', () => {
  const { html } = prepareArticle(page('<p><a href="#Tratamento">ver</a></p>'), PATH)
  assert.equal(html, '<p><a href="#Tratamento">ver</a></p>')
})

test('links externos abrem em outra aba; esquemas perigosos viram texto', () => {
  const { html } = prepareArticle(
    page('<p><a href="https://pt.wikipedia.org/x">fora</a><a href="javascript:alert(1)">mal</a></p>'),
    PATH
  )
  assert.equal(
    html,
    '<p><a href="https://pt.wikipedia.org/x" target="_blank" rel="noopener noreferrer" class="nv-ext">fora</a><span>mal</span></p>'
  )
})

test('imagens do acervo passam pelo Tropeiro; externas e atributos de evento saem', () => {
  const { html } = prepareArticle(
    page('<img src="./_res_/a.png" alt="A" onerror="x()"><img src="https://exemplo.com/b.png">'),
    PATH
  )
  assert.equal(html, '<img alt="A" src="/arquivo/wikipedia_pt_top_mini_2026-07/_res_/a.png" />')
})

test('converte caminhos do Kiwix nas rotas da interface nova', () => {
  assert.equal(readUrl('/content/livro/A_B', 'água'), '/ler/livro/A_B?q=%C3%A1gua')
  assert.equal(readUrl('/content/livro/A_B'), '/ler/livro/A_B')
  assert.equal(assetUrl('/content/livro/_res_/x.png'), '/arquivo/livro/_res_/x.png')
})

test('aceita só caminhos dentro de /content/ com livro e página', () => {
  assert.equal(toContentPath('livro/Artigo'), '/content/livro/Artigo')
  assert.equal(toContentPath('livro/Tend%C3%A3o'), '/content/livro/Tend%C3%A3o')
  assert.equal(toContentPath('livro/_res_/a.png'), '/content/livro/_res_/a.png')
  assert.equal(toContentPath('../catalog/v2/entries'), null)
  assert.equal(toContentPath('livro/../../skin/x.js'), null)
  assert.equal(toContentPath('%2e%2e/%2e%2e/skin/x'), null)
  assert.equal(toContentPath('livro'), null)
  assert.equal(toContentPath(''), null)
})

test('primeiro parágrafo longo do artigo, sem marcas de citação', async () => {
  const { leadParagraph } = await import('../../app/utils/kiwix_article.js')
  const html = page(
    '<p></p><p>Curto.</p><p>Queimadura é uma lesão na pele ou noutros tecidos causada por calor ou eletricidade.[2] A maior parte é evitável.[3]</p>'
  )
  assert.equal(
    leadParagraph(html),
    'Queimadura é uma lesão na pele ou noutros tecidos causada por calor ou eletricidade. A maior parte é evitável.'
  )
  assert.equal(leadParagraph(page('<p>Curto.</p>')), null)
})
