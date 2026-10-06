import { parse as parseYaml } from 'yaml'
import type { ContentItem, ContentProblem, ContentType } from '../../types/conteudo.js'
import type { Ficha, FichaSection } from '../../types/fichas.js'

/**
 * Leitura dos arquivos de conteúdo (conteudo/<tema>/<slug>.md). Funções puras:
 * recebem o texto e devolvem o conteúdo ou os problemas, com a linha, em
 * português, para quem contribui entender o que corrigir.
 *
 * Formato:
 *
 *   ---
 *   titulo: ...
 *   tema: radio
 *   tipo: guia | ficha | referencia
 *   resumo: ...
 *   palavras-chave: [a, b]
 *   veja-tambem: [radio/outro-conteudo]
 *   ligue-antes: ...            (só fichas, opcional)
 *   adaptacao: ...              (opcional: como o texto foi adaptado da fonte)
 *   revisao: { revisado: false, por: "" }
 *   autores: [Nome]
 *   atualizado: 2026-10-06
 *   fontes:                     (opcional; também dá para usar notas de rodapé)
 *     - { doc: id-em-fontes.yml, pagina: 12, sobre: o que foi tirado }
 *     - { doc: id, trecho: "texto exato", sobre: ... }
 *   ---
 *   Texto em Markdown. Fonte junto da frase: ...0,5 W.[^potencia]
 *
 *   [^potencia]: anatel-ato-14448-2017, trecho "15.1.3. A potência" — potência máxima
 *   [^queimadura]: ms-cartilha-queimaduras-2012, p. 6 — resfriar com água
 */

export const CONTENT_TYPES: ContentType[] = ['guia', 'ficha', 'referencia']

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Separa o cabeçalho YAML do texto. */
export function splitFrontmatter(text: string): { yaml: string; body: string; bodyLine: number } | null {
  const clean = text.replace(/^\uFEFF/, '')
  const m = clean.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return null
  return { yaml: m[1], body: clean.slice(m[0].length), bodyLine: m[0].split('\n').length }
}

const FOOTNOTE_DEF = /^\[\^([\w-]+)\]:\s*(.+)$/
const FOOTNOTE_REF = /\[\^([\w-]+)\](?!:)/g

/**
 * Uma fonte escrita como texto: `<doc>, p. 12 — sobre` ou
 * `<doc>, trecho "texto exato" — sobre`.
 */
export function parseSourceText(value: string): { doc: string; page?: number; anchor?: string; about: string } | null {
  const m = value.match(/^([a-z0-9-]+),\s*(?:p\.\s*(\d+)|trecho\s+"([^"]+)")\s*[—–-]\s*(.+)$/i)
  if (!m) return null
  return {
    doc: m[1],
    ...(m[2] ? { page: Number(m[2]) } : {}),
    ...(m[3] ? { anchor: m[3] } : {}),
    about: m[4].trim(),
  }
}

/** Notas de fonte: tira as definições do texto e devolve cada uma pelo id. */
export function extractFootnotes(body: string, bodyLine: number, file: string) {
  const notes = new Map<string, { doc: string; page?: number; anchor?: string; about: string }>()
  const problems: ContentProblem[] = []
  const kept: string[] = []
  body.split('\n').forEach((line, i) => {
    const m = line.match(FOOTNOTE_DEF)
    if (!m) return void kept.push(line)
    const source = parseSourceText(m[2])
    if (!source) {
      problems.push({
        file,
        line: bodyLine + i,
        message: `nota [^${m[1]}] fora do formato: use 'id-do-documento, p. 12 — sobre o quê' ou 'id-do-documento, trecho "texto exato" — sobre o quê'`,
      })
    } else notes.set(m[1], source)
  })
  return { body: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', notes, problems }
}

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [])

/** Lê um arquivo de conteúdo. `file` é o caminho relativo a conteudo/, como `radio/radios-sem-licenca.md`. */
export function parseContent(text: string, file: string): { item: ContentItem | null; problems: ContentProblem[] } {
  const problems: ContentProblem[] = []
  const fail = (message: string, line?: number) => problems.push({ file, line, message })

  const parts = splitFrontmatter(text)
  if (!parts) {
    fail('falta o cabeçalho: o arquivo deve começar com --- , os campos, e --- de novo', 1)
    return { item: null, problems }
  }

  let data: Record<string, any>
  try {
    data = parseYaml(parts.yaml) ?? {}
  } catch (err) {
    fail(`cabeçalho com YAML inválido: ${(err as Error).message.split('\n')[0]}`, 2)
    return { item: null, problems }
  }

  const pathMatch = file.replace(/\\/g, '/').match(/^([^/]+)\/([^/]+)\.md$/)
  if (!pathMatch) fail('o arquivo deve ficar em conteudo/<tema>/<slug>.md')
  const [, folderTheme, slug] = pathMatch ?? [null, '', '']
  if (slug && !SLUG.test(slug)) fail(`nome do arquivo "${slug}" deve ter só letras minúsculas sem acento, números e hífens`)

  const required = (key: string) => {
    const v = data[key]
    if (v === undefined || v === null || String(v).trim() === '') fail(`falta o campo "${key}" no cabeçalho`)
    return v === undefined || v === null ? '' : String(v).trim()
  }
  const title = required('titulo')
  const theme = required('tema')
  const type = required('tipo') as ContentType
  const summary = required('resumo')
  if (theme && folderTheme && theme !== folderTheme) fail(`"tema: ${theme}" não bate com a pasta "${folderTheme}"`)
  if (type && !CONTENT_TYPES.includes(type)) fail(`"tipo: ${type}" inválido; use ${CONTENT_TYPES.join(', ')}`)

  const keywords = asList(data['palavras-chave'])
  if (keywords.length === 0) fail('"palavras-chave" precisa de pelo menos uma palavra, como [walkie-talkie, rádio]')
  const authors = asList(data.autores)
  if (authors.length === 0) fail('"autores" precisa de pelo menos um nome')

  const updated = data.atualizado instanceof Date ? data.atualizado.toISOString().slice(0, 10) : String(data.atualizado ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) fail('"atualizado" deve ser uma data no formato AAAA-MM-DD')

  const review = data.revisao ?? {}
  if (typeof review.revisado !== 'boolean') fail('"revisao.revisado" deve ser true ou false')
  if (review.revisado === true && !String(review.por ?? '').trim()) fail('conteúdo revisado precisa dizer por quem em "revisao.por"')

  const { body, notes, problems: noteProblems } = extractFootnotes(parts.body, parts.bodyLine, file)
  problems.push(...noteProblems)

  // Toda nota usada no texto precisa estar definida, e vice-versa.
  const used = new Set([...body.matchAll(FOOTNOTE_REF)].map((m) => m[1]))
  for (const id of used) if (!notes.has(id)) fail(`a nota [^${id}] é usada no texto mas não está definida`)
  for (const id of notes.keys()) if (!used.has(id)) fail(`a nota [^${id}] está definida mas não é usada no texto`)

  const refs: ContentItem['refs'] = [...notes.entries()].map(([note, s]) => ({ ...s, note }))
  for (const [i, f] of (Array.isArray(data.fontes) ? data.fontes : []).entries()) {
    if (!f?.doc || !f?.sobre || (f.pagina === undefined && !f.trecho)) {
      fail(`fontes[${i}] precisa de doc, sobre e pagina ou trecho`)
      continue
    }
    refs.push({
      doc: String(f.doc),
      about: String(f.sobre),
      ...(f.pagina !== undefined ? { page: Number(f.pagina) } : {}),
      ...(f.trecho ? { anchor: String(f.trecho) } : {}),
    })
  }
  if (refs.length === 0) fail('todo conteúdo precisa de pelo menos uma fonte oficial (nota [^id] ou lista "fontes")')
  if (!body.trim()) fail('o texto está vazio')

  if (problems.length) return { item: null, problems }
  return {
    item: {
      id: `${theme}/${slug}`,
      theme,
      slug: slug!,
      type,
      title,
      summary,
      keywords,
      seeAlso: asList(data['veja-tambem']),
      ...(data['ligue-antes'] ? { callFirst: String(data['ligue-antes']).trim() } : {}),
      ...(data.adaptacao ? { adaptation: String(data.adaptacao).trim() } : {}),
      reviewed: review.revisado === true,
      ...(review.por ? { reviewedBy: String(review.por) } : {}),
      authors,
      updated,
      body,
      refs,
      file,
    },
    problems,
  }
}

/** Texto sem as marcas de nota de fonte ([^id]), para mostrar em lista ou mandar à IA. */
export function stripFootnoteRefs(text: string): string {
  return text.replace(FOOTNOTE_REF, '').replace(/[ \t]+([.,;:!?])/g, '$1').trim()
}

const SECTION_KIND: [RegExp, FichaSection['kind']][] = [
  [/^não faça\b/i, 'dont'],
  [/^faça\b/i, 'do'],
  [/^(procure ajuda|peça ajuda|procure atendimento)\b/i, 'help'],
]

/**
 * Ficha a partir do conteúdo: cada "## Faça", "## Não faça" ou
 * "## Procure ajuda" vira uma seção; o que vem depois de " — " no título é o
 * nome da seção; os itens são as linhas de lista.
 */
export function toFicha(item: ContentItem): { ficha: Ficha | null; problems: ContentProblem[] } {
  const problems: ContentProblem[] = []
  const sections: FichaSection[] = []
  let current: FichaSection | null = null
  for (const line of item.body.split('\n')) {
    const h = line.match(/^##\s+(.+)$/)
    if (h) {
      const [head, ...rest] = h[1].split(/\s+[—–-]\s+/)
      const kind = SECTION_KIND.find(([re]) => re.test(head.trim()))?.[1]
      if (!kind) {
        problems.push({ file: item.file, message: `seção "## ${h[1]}" de ficha deve começar com "Faça", "Não faça" ou "Procure ajuda"` })
        current = null
        continue
      }
      current = { kind, ...(rest.length ? { title: rest.join(' — ').trim() } : {}), items: [] }
      sections.push(current)
      continue
    }
    const li = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/)
    if (li && current) current.items.push(stripFootnoteRefs(li[1]))
  }
  if (!sections.some((s) => s.kind === 'do')) problems.push({ file: item.file, message: 'ficha precisa de uma seção "## Faça"' })
  for (const s of sections) if (s.items.length === 0) problems.push({ file: item.file, message: `seção "${s.title ?? s.kind}" da ficha está sem itens` })
  if (problems.length) return { ficha: null, problems }
  return {
    ficha: {
      slug: item.slug,
      title: item.title,
      summary: item.summary,
      keywords: item.keywords,
      ...(item.callFirst ? { callFirst: item.callFirst } : {}),
      ...(item.adaptation ? { adaptation: item.adaptation } : {}),
      sections,
      refs: item.refs.map(({ doc, page, anchor, about }) => ({ doc, about, ...(page ? { page } : {}), ...(anchor ? { anchor } : {}) })),
      reviewed: item.reviewed,
    },
    problems,
  }
}

/** Tabelas Markdown com o mesmo número de colunas em todas as linhas. */
export function tableProblems(item: ContentItem): ContentProblem[] {
  const problems: ContentProblem[] = []
  const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').length
  let width = 0
  for (const line of item.body.split('\n')) {
    if (!line.trim().startsWith('|')) {
      width = 0
      continue
    }
    const n = cells(line)
    if (width === 0) width = n
    else if (n !== width) problems.push({ file: item.file, message: `tabela com linha de ${n} colunas, mas o cabeçalho tem ${width}: ${line.trim().slice(0, 60)}` })
  }
  return problems
}

/**
 * Conteúdo como texto para a base de conhecimento da IA: tabelas viram linhas
 * "coluna: valor" (um modelo pequeno lê melhor), avisos viram "Atenção:" e as
 * notas de fonte saem do texto (a fonte vai no fim).
 */
export function contentPlainText(item: ContentItem, docTitle: (id: string) => string | undefined): string {
  const out: string[] = [`# ${item.title}`, item.summary, '']
  let header: string[] | null = null
  for (const raw of item.body.split('\n')) {
    const line = stripFootnoteRefs(raw)
    if (line.startsWith('|')) {
      const cols = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
      if (cols.every((c) => /^:?-{2,}:?$/.test(c))) continue
      if (!header) header = cols
      else out.push(`- ${cols.map((c, i) => (header![i] ? `${header![i]}: ${c}` : c)).join('; ')}`)
      continue
    }
    header = null
    if (/^>\s*\[!\w+\]/.test(line)) {
      out.push('Atenção:')
      continue
    }
    out.push(line.replace(/^>\s?/, ''))
  }
  const fontes = [...new Set(item.refs.map((r) => r.doc))].map(docTitle).filter(Boolean)
  if (fontes.length) out.push('', `Fontes: ${fontes.join('; ')}.`)
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
