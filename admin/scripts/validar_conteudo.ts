/**
 * Valida a pasta conteudo/: formato de cada arquivo, fontes, temas, "veja
 * também" e tabelas. Com os documentos já baixados (storage/referencias),
 * confere também se cada trecho citado existe no documento.
 *
 *   npm run conteudo:validar
 *
 * Sai com código 1 se houver problema, para barrar o PR.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadContent } from '../app/content/loader.js'
import { validateContent } from '../app/utils/conteudo_validacao.js'
import { htmlText } from '../app/utils/html_snapshot.js'

const content = loadContent()
const docsDir = join(process.cwd(), 'storage', 'referencias')
const pageText = (id: string) => {
  const path = join(docsDir, `${id}.html`)
  return existsSync(path) ? htmlText(readFileSync(path, 'utf-8')) : null
}
const problems = validateContent(content, pageText)

for (const p of problems) console.log(`conteudo/${p.file}${p.line ? `:${p.line}` : ''}: ${p.message}`)
const fichas = content.items.filter((i) => i.type === 'ficha').length
console.log(
  `\n${content.items.length} conteúdos (${fichas} fichas), ${content.sources.length} fontes, ${content.themes.length} temas: ` +
    (problems.length ? `${problems.length} problema(s).` : 'tudo certo.')
)
process.exit(problems.length ? 1 : 0)
