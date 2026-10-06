import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { decodeHtml, htmlText, markPassage, snapshotHtml } from '../../app/utils/html_snapshot.js'

test('lê windows-1252 pelo meta da página', () => {
  const raw = Uint8Array.from([...Buffer.from('<meta charset="windows-1252"><p>Independer'), 0xe3, ...Buffer.from('o</p>')])
  assert.match(decodeHtml(raw), /Independerão/)
})

test('cópia limpa: sem script, evento, formulário nem imagem, com aviso de origem', () => {
  const html = `<html><head><script>x()</script></head><body onload="x()">
    <h1>Ato 14.448</h1><script>alert(1)</script><a href="javascript:x()">link</a>
    <form><input name="q"></form><img src="https://exemplo/a.png"><p onclick="y()">15.1.3. 500 mW</p></body></html>`
  const out = snapshotHtml(html, { title: 'Ato 14.448', url: 'https://anatel/ato', date: '06/10/2026' })
  assert.doesNotMatch(out, /<script|onclick|onload|javascript:|<form|<input|<img/i)
  assert.match(out, /15\.1\.3\. 500 mW/)
  assert.match(out, /Cópia guardada pelo Tropeiro em 06\/10\/2026, de <span>https:\/\/anatel\/ato<\/span>/)
})

test('texto visível para conferir a página', () => {
  assert.equal(htmlText('<p>Canal&nbsp;1</p><script>x</script><b>462,5625</b>').trim(), 'Canal 1 462,5625')
})

test('sem charset declarado e sem ser UTF-8 válido, lê como windows-1252', () => {
  const raw = Uint8Array.from([...Buffer.from('<p>Independer'), 0xe3, ...Buffer.from('o de outorga</p>')])
  assert.match(decodeHtml(raw), /Independerão de outorga/)
})

test('guarda só o texto da norma, sem o menu do portal, e links viram texto', () => {
  const html = `<body><nav><a href="/legislacao">Legislação</a></nav>
    <div class="item-page"><h1>Ato 14.448</h1><div><p>15.1.3. 500 mW <a href="https://anatel/x">ver</a> <a href="#t12">tabela</a></p></div></div>
    <footer>Rodapé</footer></body>`
  const out = snapshotHtml(html, { title: 't', url: 'u', date: 'd' })
  assert.match(out, /15\.1\.3\. 500 mW/)
  assert.doesNotMatch(out, /Legislação|Rodapé|https:\/\/anatel\/x/)
  assert.match(out, /<a>ver<\/a>/)
  assert.match(out, /<a href="#t12">tabela<\/a>/)
})

test('destaca o trecho citado com a âncora #trecho', () => {
  const out = markPassage('<p>15.1.3.&nbsp;A potência efetivamente radiada não deve exceder a 500 mW.</p>', '15.1.3. A potência efetivamente radiada')
  assert.equal(out, '<p><mark id="trecho" style="background:#ffe08a;padding:2px 0">15.1.3. A potência efetivamente radiada</mark> não deve exceder a 500 mW.</p>')
  assert.equal(markPassage('<p>outro texto</p>', 'não existe'), '<p>outro texto</p>')
})
