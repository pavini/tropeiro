import { tableProblems } from './conteudo.js'
import type { ContentProblem } from '../../types/conteudo.js'
import type { LoadedContent } from '../content/loader.js'

/**
 * Regras que o conteúdo precisa cumprir além do formato de cada arquivo:
 * fontes que existem, lugar citado do jeito certo (página no PDF, trecho na
 * página HTML), temas e "veja também" que existem, tabelas consistentes.
 * `pageText`, quando informado, devolve o texto de um documento HTML já
 * baixado, para conferir se cada trecho citado existe nele.
 */
export function validateContent(content: LoadedContent, pageText?: (docId: string) => string | null): ContentProblem[] {
  const problems: ContentProblem[] = [...content.problems]
  const fontes = 'fontes.yml'

  const ids = new Set<string>()
  for (const doc of content.sources) {
    if (ids.has(doc.id)) problems.push({ file: fontes, message: `id repetido: ${doc.id}` })
    ids.add(doc.id)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(doc.id)) problems.push({ file: fontes, message: `${doc.id}: id só com minúsculas sem acento, números e hífens` })
    if (!/^https:\/\//.test(doc.url)) problems.push({ file: fontes, message: `${doc.id}: url precisa ser https` })
    if (!doc.title || !doc.publisher || !doc.year) problems.push({ file: fontes, message: `${doc.id}: falta titulo, publicador ou ano` })
    if (!doc.license.trim()) problems.push({ file: fontes, message: `${doc.id}: falta a nota de licença (licenca)` })
    if (!content.themes.some((t) => t.id === doc.theme)) problems.push({ file: fontes, message: `${doc.id}: tema "${doc.theme}" não existe em temas.yml` })
    if (doc.format === 'html') {
      if (!doc.mustContain?.length) problems.push({ file: fontes, message: `${doc.id}: página HTML precisa de "trechos" para conferir o download` })
    } else {
      if (!/^[0-9a-f]{64}$/.test(doc.sha256)) problems.push({ file: fontes, message: `${doc.id}: PDF precisa de sha256 (64 caracteres)` })
      if (!(doc.sizeBytes > 0)) problems.push({ file: fontes, message: `${doc.id}: PDF precisa do tamanho em bytes` })
    }
  }

  const itemIds = new Set(content.items.map((i) => i.id))
  for (const item of content.items) {
    if (!content.themes.some((t) => t.id === item.theme)) problems.push({ file: item.file, message: `tema "${item.theme}" não existe em temas.yml` })
    for (const id of item.seeAlso) {
      if (!itemIds.has(id)) problems.push({ file: item.file, message: `"veja-tambem" aponta para "${id}", que não existe` })
    }
    for (const ref of item.refs) {
      const where = ref.note ? `nota [^${ref.note}]` : `fonte "${ref.about}"`
      const doc = content.sources.find((d) => d.id === ref.doc)
      if (!doc) {
        problems.push({ file: item.file, message: `${where}: documento "${ref.doc}" não está em fontes.yml` })
        continue
      }
      if (doc.format === 'html') {
        if (!ref.anchor) problems.push({ file: item.file, message: `${where}: ${doc.id} é página HTML; cite um trecho exato, não página` })
        else {
          const text = pageText?.(doc.id)
          if (text && !text.includes(ref.anchor)) {
            problems.push({ file: item.file, message: `${where}: o trecho "${ref.anchor}" não aparece em ${doc.id}` })
          }
        }
      } else if (!(Number.isInteger(ref.page) && ref.page! > 0)) {
        problems.push({ file: item.file, message: `${where}: ${doc.id} é PDF; cite a página (p. 12)` })
      }
    }
    problems.push(...tableProblems(item))
  }
  return problems
}
