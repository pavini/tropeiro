/**
 * Cópia limpa de uma página oficial (norma da Anatel, lei no Planalto) para
 * guardar no servidor e abrir sem internet. Tira tudo que executa ou busca
 * coisa de fora (scripts, estilos externos, formulários, iframes), mantém o
 * texto e põe no topo de onde e quando a cópia foi feita.
 */

/** Lê o charset do cabeçalho ou da própria página; o Planalto usa windows-1252. */
export function decodeHtml(raw: Uint8Array, contentType?: string): string {
  const fromHeader = contentType?.match(/charset=([\w-]+)/i)?.[1]
  const head = new TextDecoder('latin1').decode(raw.subarray(0, 4096))
  const fromMeta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
  const declared = (fromHeader || fromMeta || '').toLowerCase()
  if (declared && declared !== 'utf-8') {
    try {
      return new TextDecoder(declared === 'iso-8859-1' ? 'windows-1252' : declared).decode(raw)
    } catch {
      // charset desconhecido: tenta UTF-8 abaixo
    }
  }
  // Sem charset declarado (ou declarado errado): se não for UTF-8 válido, é windows-1252.
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(raw)
  } catch {
    return new TextDecoder('windows-1252').decode(raw)
  }
}

/** Texto visível, sem marcação, para conferir se a página é a esperada. */
export function htmlText(html: string): string {
  return html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Onde fica o texto da norma em cada portal, do mais específico ao mais geral. */
const CONTENT_MARKERS = [/<div\b[^>]*class="item-page[^"]*"[^>]*>/i, /<div\b[^>]*id="content-core"[^>]*>/i, /<main\b[^>]*>/i]

/** O elemento que começa em `start`, até a tag que o fecha (contando os aninhados). */
function element(html: string, start: number): string {
  const tag = html.slice(start).match(/^<(\w+)/)![1].toLowerCase()
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi')
  re.lastIndex = start
  let depth = 0
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1
    if (depth === 0) return html.slice(start, m.index + m[0].length)
  }
  return html.slice(start)
}

/** Só o texto principal da página: sem menus, cabeçalho e rodapé do portal. */
export function mainContent(html: string): string {
  for (const marker of CONTENT_MARKERS) {
    const m = marker.exec(html)
    if (m) return element(html, m.index)
  }
  return html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html
}

export function snapshotHtml(html: string, info: { title: string; url: string; date: string }): string {
  const body = mainContent(html)
    .replace(/<(script|style|noscript|iframe|object|embed|form|template)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|link|meta|iframe|object|embed|input|button|select|textarea|base)\b[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '')
    // Imagens externas não carregam offline; o texto basta.
    .replace(/<img\b[^>]*>/gi, '')
    // Links do portal não funcionam offline: viram texto (âncoras internas ficam).
    .replace(/<a\b([^>]*)>/gi, (_m, attrs: string) => {
      const href = attrs.match(/href\s*=\s*("|')(#[^"']*)\1/i)?.[2]
      return href ? `<a href="${href}">` : '<a>'
    })

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(info.title)}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:16px;line-height:1.5;color:#15201a;background:#fff}
.tropeiro-copia{background:#fff1cc;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:14px}
table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #ccc;padding:4px 6px}
</style>
</head>
<body>
<p class="tropeiro-copia">Cópia guardada pelo Tropeiro em ${escape(info.date)}, de <span>${escape(info.url)}</span>. Para fins legais, vale o texto publicado no Diário Oficial.</p>
${body}
</body>
</html>
`
}

/**
 * Destaca na cópia guardada o trecho citado e põe nele a âncora #trecho, para
 * a página abrir já no lugar certo sem depender de recurso do navegador. Se o
 * trecho não for achado, a página abre do começo.
 */
export function markPassage(html: string, passage: string): string {
  const text = html.replace(/&nbsp;/g, ' ')
  const i = passage ? text.indexOf(passage) : -1
  if (i < 0) return html
  return (
    text.slice(0, i) +
    `<mark id="trecho" style="background:#ffe08a;padding:2px 0">${passage}</mark>` +
    text.slice(i + passage.length)
  )
}
