import * as cheerio from 'cheerio'
import sanitizeHtml from 'sanitize-html'

/**
 * Prepara um artigo do Kiwix para ser lido dentro do Tropeiro: extrai só o
 * conteúdo, tira o que é da interface da Wikipedia, sanitiza o HTML e reescreve
 * links e imagens para passarem pelo próprio Tropeiro (uma porta só).
 */

/** Origem fictícia, só para resolver caminhos relativos do artigo. */
const ORIGIN = 'http://kiwix.invalid'

/** Prefixo das rotas de leitura e de arquivos da interface nova. */
export const READ_PREFIX = '/novo/ler'
export const ASSET_PREFIX = '/novo/arquivo'

/** Partes da página que não são conteúdo. */
const REMOVE = [
  'script',
  'style',
  'link',
  'noscript',
  '.mw-editsection',
  '.mw-jump-link',
  '.mw-empty-elt',
  '.navbox',
  '.navbox-styles',
  '.noprint',
  '.metadata',
  '.ambox',
  '.sistersitebox',
  '#toc',
  '.toc',
].join(', ')

/** `/content/livro/Artigo` → `/novo/ler/livro/Artigo?q=...` */
export function readUrl(contentPath: string, q?: string): string {
  const rest = contentPath.replace(/^\/content\//, '')
  return `${READ_PREFIX}/${rest}${q ? `?q=${encodeURIComponent(q)}` : ''}`
}

/** `/content/livro/_res_/x.png` → `/novo/arquivo/livro/_res_/x.png` */
export function assetUrl(contentPath: string): string {
  return `${ASSET_PREFIX}/${contentPath.replace(/^\/content\//, '')}`
}

/**
 * Converte o resto da URL (`livro/Artigo`) num caminho do Kiwix
 * (`/content/livro/Artigo`), ou null se sair de /content/ (ex.: com `..`).
 */
export function toContentPath(rest: string): string | null {
  const clean = rest.replace(/^\/+/, '')
  if (!clean) return null
  try {
    const { pathname } = new URL(`/content/${clean}`, ORIGIN)
    const segments = pathname.split('/')
    // /content/<livro>/<algo>: pelo menos o livro e uma página.
    if (!pathname.startsWith('/content/') || segments.length < 4 || !segments[2]) return null
    return pathname
  } catch {
    return null
  }
}

export interface PreparedArticle {
  title: string
  html: string
}

export function prepareArticle(raw: string, contentPath: string, q?: string): PreparedArticle {
  const $ = cheerio.load(raw)
  const title = ($('#firstHeading').first().text() || $('title').first().text() || '')
    .replace(/\s+/g, ' ')
    .trim()

  let root = $('#mw-content-text').first()
  if (!root.length) root = $('#bodyContent').first()
  if (!root.length) root = $('main').first()
  if (!root.length) root = $('body').first()
  root.find(REMOVE).remove()

  const articleUrl = new URL(contentPath, ORIGIN)

  const html = sanitizeHtml(root.html() ?? '', {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'figure',
      'figcaption',
      'details',
      'summary',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan', 'scope'],
      '*': ['id', 'lang', 'dir'],
    },
    allowedClasses: { a: ['nv-ext'] },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs): sanitizeHtml.Tag => {
        const link = rewriteHref(attribs.href, articleUrl, q)
        if (!link) return { tagName: 'span', attribs: {} }
        if (link.external) {
          return {
            tagName,
            attribs: { href: link.href, target: '_blank', rel: 'noopener noreferrer', class: 'nv-ext' },
          }
        }
        return { tagName, attribs: { href: link.href } }
      },
      img: (tagName, attribs): sanitizeHtml.Tag => {
        const src = rewriteSrc(attribs.src, articleUrl)
        const out: Record<string, string> = { alt: attribs.alt ?? '' }
        if (src) out.src = src
        if (attribs.width) out.width = attribs.width
        if (attribs.height) out.height = attribs.height
        return { tagName, attribs: out }
      },
    },
    // Imagem sem endereço local (externa ou inválida) não aparece.
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  })

  return { title, html }
}

function rewriteHref(
  href: string | undefined,
  articleUrl: URL,
  q?: string
): { href: string; external: boolean } | null {
  if (!href) return null
  if (href.startsWith('#')) return { href, external: false }
  let url: URL
  try {
    url = new URL(href, articleUrl)
  } catch {
    return null
  }
  if (url.origin === ORIGIN) {
    if (url.pathname === articleUrl.pathname && url.hash) return { href: url.hash, external: false }
    if (url.pathname.startsWith('/content/')) {
      return { href: readUrl(url.pathname, q) + url.hash, external: false }
    }
    return null
  }
  if (url.protocol === 'http:' || url.protocol === 'https:') return { href: url.href, external: true }
  return null
}

function rewriteSrc(src: string | undefined, articleUrl: URL): string | null {
  if (!src) return null
  try {
    const url = new URL(src, articleUrl)
    if (url.origin === ORIGIN && url.pathname.startsWith('/content/')) return assetUrl(url.pathname)
  } catch {
    // endereço inválido: a imagem sai
  }
  return null
}

/**
 * Primeiro parágrafo de verdade do artigo (pula parágrafos curtos ou vazios),
 * sem as marcas de citação da Wikipedia ("[2]"). Serve de trecho na busca quando
 * o do Kiwix vem de uma caixa de navegação.
 */
export function leadParagraph(raw: string, minLength = 60): string | null {
  const $ = cheerio.load(raw)
  let root = $('#mw-content-text').first()
  if (!root.length) root = $('body').first()
  root.find(REMOVE).remove()
  for (const el of root.find('p').toArray()) {
    const text = $(el)
      .text()
      .replace(/\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length >= minLength) return text
  }
  return null
}

