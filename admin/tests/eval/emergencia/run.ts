/**
 * Teste das respostas de emergência da IA, contra o servidor rodando, pelo
 * mesmo caminho da tela Perguntar (/api/ollama/chat, com a base de
 * conhecimento). Corrige cada resposta pelas regras de perguntas.json e salva
 * o relatório em tests/eval/reports/.
 *
 *   node --import ts-node-maintained/register/esm tests/eval/emergencia/run.ts \
 *     --model=llama3.1:8b --rotulo=depois [--url=http://localhost:8080] [--so=cobra,engasgo]
 *
 * As respostas variam de uma rodada para outra; compare totais, não uma
 * pergunta isolada.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { corrigir, type Correcao, type Pergunta } from './score.js'

const aqui = dirname(fileURLToPath(import.meta.url))
const arg = (nome: string, padrao?: string) =>
  process.argv.find((a) => a.startsWith(`--${nome}=`))?.split('=').slice(1).join('=') ?? padrao

const url = arg('url', 'http://localhost:8080')!
const model = arg('model')
const rotulo = arg('rotulo', 'rodada')!
const so = arg('so')?.split(',')
if (!model) {
  console.error('Informe o modelo: --model=llama3.1:8b')
  process.exit(1)
}

/** Pergunta com streaming (os cabeçalhos chegam na hora, sem estourar tempo). */
async function perguntar(texto: string): Promise<{ resposta: string; fontes: { title: string; href?: string }[] }> {
  const res = await fetch(`${url}/api/ollama/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify({ model, stream: true, messages: [{ role: 'user', content: texto }] }),
  })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
  let resposta = ''
  let fontes: { title: string; href?: string }[] = []
  let buffer = ''
  const decoder = new TextDecoder()
  for await (const pedaco of res.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(pedaco, { stream: true })
    const linhas = buffer.split('\n')
    buffer = linhas.pop() ?? ''
    for (const linha of linhas) {
      if (!linha.startsWith('data: ')) continue
      try {
        const evento = JSON.parse(linha.slice(6))
        if (evento.error) throw new Error(typeof evento.message === 'string' ? evento.message : 'erro no stream')
        if (evento.message?.content) resposta += evento.message.content
        if (Array.isArray(evento.sources)) fontes = evento.sources
      } catch (err) {
        // Linha que não é JSON (fim do stream) é ignorada; erro do servidor sobe.
        if (!(err instanceof SyntaxError)) throw err
      }
    }
  }
  return { resposta, fontes }
}

const perguntas: Pergunta[] = JSON.parse(await readFile(join(aqui, 'perguntas.json'), 'utf-8'))
const selecionadas = so ? perguntas.filter((p) => so.includes(p.id)) : perguntas
const resultados: (Correcao & { pergunta: string; resposta: string; fontes: string[]; segundos: number })[] = []

// O relatório é gravado a cada pergunta: uma rodada interrompida não perde o que já respondeu.
const relatorios = join(aqui, '..', 'reports')
await mkdir(relatorios, { recursive: true })
const arquivo = join(relatorios, `emergencia-${rotulo}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
const gravar = () => {
  const acertos = resultados.reduce((s, r) => s + r.acertos, 0)
  const total = resultados.reduce((s, r) => s + r.total, 0)
  return writeFile(arquivo, JSON.stringify({ model, rotulo, acertos, total, resultados }, null, 2))
}

for (const p of selecionadas) {
  const inicio = Date.now()
  // Falha do servidor (não uma resposta ruim) é tentada de novo, até 3 vezes.
  let obtido: Awaited<ReturnType<typeof perguntar>> | null = null
  for (let tentativa = 1; tentativa <= 3 && !obtido; tentativa++) {
    try {
      obtido = await perguntar(p.pergunta)
      if (!obtido.resposta.trim()) throw new Error('resposta vazia')
    } catch (err) {
      obtido = null
      console.log(`     tentativa ${tentativa} de ${p.id} falhou: ${(err as Error).message}`)
    }
  }
  if (!obtido) {
    console.log(`ERRO  ${p.id}: sem resposta depois de 3 tentativas`)
    continue
  }
  const { resposta, fontes } = obtido
  const correcao = corrigir(p, resposta, fontes)
  const segundos = Math.round((Date.now() - inicio) / 1000)
  resultados.push({ ...correcao, pergunta: p.pergunta, resposta, fontes: fontes.map((f) => f.title), segundos })
  await gravar()
  const falhas = correcao.verificacoes.filter((v) => !v.ok).map((v) => v.regra + (v.trecho ? ` («${v.trecho}»)` : ''))
  console.log(`${correcao.acertos}/${correcao.total}  ${p.id} (${segundos}s)${falhas.length ? '\n     falhou: ' + falhas.join('\n             ') : ''}`)
}

const acertos = resultados.reduce((s, r) => s + r.acertos, 0)
const total = resultados.reduce((s, r) => s + r.total, 0)
const porRegra = (prefixo: string) => {
  const vs = resultados.flatMap((r) => r.verificacoes.filter((v) => v.regra.startsWith(prefixo)))
  return `${vs.filter((v) => v.ok).length}/${vs.length}`
}
console.log(`\nTotal: ${acertos}/${total} (${Math.round((acertos / total) * 100)}%)`)
console.log(`  diz o que precisa:      ${porRegra('diz:')}`)
console.log(`  não diz o proibido:     ${porRegra('não diz:')}`)
console.log(`  caminho sem socorro:    ${porRegra('caminho sem socorro')}`)
console.log(`  cita documento oficial: ${porRegra('cita documento oficial')}`)

console.log(`\nRelatório: ${arquivo}`)
