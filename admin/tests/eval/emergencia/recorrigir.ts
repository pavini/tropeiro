/**
 * Corrige de novo as respostas guardadas num relatório, com as regras atuais
 * de perguntas.json e score.ts. Serve para comparar rodadas antigas depois de
 * ajustar o corretor, sem perguntar tudo à IA de novo.
 *
 *   node --import ts-node-maintained/register/esm tests/eval/emergencia/recorrigir.ts <relatorio.json>
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { corrigir, type Pergunta } from './score.js'

const aqui = dirname(fileURLToPath(import.meta.url))
const arquivo = process.argv[2]
if (!arquivo) {
  console.error('Informe o relatório: recorrigir.ts tests/eval/reports/emergencia-....json')
  process.exit(1)
}
const perguntas: Pergunta[] = [
  ...JSON.parse(await readFile(join(aqui, 'perguntas.json'), 'utf-8')),
  ...JSON.parse(await readFile(join(aqui, 'radio.json'), 'utf-8')),
]
const relatorio = JSON.parse(await readFile(arquivo, 'utf-8'))

let acertos = 0
let total = 0
const porRegra = new Map<string, [number, number]>()
for (const r of relatorio.resultados) {
  const p = perguntas.find((x) => x.id === r.id)
  if (!p) continue
  // O relatório guarda só o título das fontes; documento oficial é o que tem página.
  const fontes = (r.fontes as string[]).map((t) => ({ href: /, p\. \d/.test(t) ? '/referencias/' : undefined }))
  const c = corrigir(p, r.resposta, fontes)
  acertos += c.acertos
  total += c.total
  for (const v of c.verificacoes) {
    const chave = v.regra.startsWith('diz:') ? 'diz' : v.regra.startsWith('não diz:') ? 'nao' : v.regra
    const [ok, n] = porRegra.get(chave) ?? [0, 0]
    porRegra.set(chave, [ok + (v.ok ? 1 : 0), n + 1])
  }
  const falhas = c.verificacoes.filter((v) => !v.ok).map((v) => v.regra)
  console.log(`${c.acertos}/${c.total}  ${r.id}${falhas.length ? '  — falhou: ' + falhas.join('; ') : ''}`)
}
const f = (k: string) => (porRegra.get(k) ?? [0, 0]).join('/')
console.log(`\nTotal: ${acertos}/${total} (${Math.round((acertos / total) * 100)}%)`)
console.log(`  diz o que precisa:      ${f('diz')}`)
console.log(`  não diz o proibido:     ${f('nao')}`)
console.log(`  caminho sem socorro:    ${f('caminho sem socorro')}`)
console.log(`  cita documento oficial: ${f('cita documento oficial')}`)
