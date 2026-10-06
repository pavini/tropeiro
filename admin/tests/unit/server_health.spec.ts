import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { healthChecks, overallLevel, stoppedServices, type HealthInput } from '../../inertia/novo/serverHealth.js'

const GB = 1024 ** 3
const healthy: HealthInput = {
  library: { installed: true, reachable: true, books: 12 },
  ai: { installed: true, model: 'llama3.1:8b' },
  stoppedApps: [],
  downloads: { workerAlive: true, active: 0, failed: 0 },
  disk: { free: 200 * GB, total: 500 * GB },
  references: { total: 7, available: 7 },
  online: true,
}
const level = (input: HealthInput, id: string) => healthChecks(input).find((c) => c.id === id)?.level

test('servidor saudável: tudo ok', () => {
  assert.equal(overallLevel(healthChecks(healthy)), 'ok')
})

test('sem internet não é problema', () => {
  const checks = healthChecks({ ...healthy, online: false })
  assert.equal(level({ ...healthy, online: false }, 'internet'), 'info')
  assert.equal(overallLevel(checks), 'info')
})

test('biblioteca fora do ar é problema; vazia ou ausente é aviso', () => {
  assert.equal(level({ ...healthy, library: { installed: true, reachable: false, books: 0 } }, 'library'), 'error')
  assert.equal(level({ ...healthy, library: { installed: true, reachable: true, books: 0 } }, 'library'), 'warn')
  assert.equal(level({ ...healthy, library: { installed: false, reachable: false, books: 0 } }, 'library'), 'warn')
})

test('IA é opcional; instalada sem modelo é aviso', () => {
  assert.equal(level({ ...healthy, ai: { installed: false, model: null } }, 'ai'), 'info')
  assert.equal(level({ ...healthy, ai: { installed: true, model: null } }, 'ai'), 'warn')
})

test('downloads parados com worker morto é problema; worker morto sem fila não', () => {
  assert.equal(level({ ...healthy, downloads: { workerAlive: false, active: 3, failed: 0 } }, 'downloads'), 'error')
  assert.equal(level({ ...healthy, downloads: { workerAlive: false, active: 0, failed: 0 } }, 'downloads'), 'ok')
  assert.equal(level({ ...healthy, downloads: { workerAlive: true, active: 0, failed: 2 } }, 'downloads'), 'warn')
})

test('disco: menos de 10% livre é problema, menos de 20% é aviso', () => {
  assert.equal(level({ ...healthy, disk: { free: 40 * GB, total: 500 * GB } }, 'disk'), 'error')
  assert.equal(level({ ...healthy, disk: { free: 80 * GB, total: 500 * GB } }, 'disk'), 'warn')
  assert.equal(level({ ...healthy, disk: null }, 'disk'), undefined)
  const low = healthChecks({ ...healthy, disk: { free: 40 * GB, total: 500 * GB } }).find((c) => c.id === 'disk')
  assert.equal(low?.action?.href, '/conteudo')
})

test('app parado é aviso e aparece pelo nome', () => {
  const check = healthChecks({ ...healthy, stoppedApps: ['Biblioteca de Informações'] }).find((c) => c.id === 'apps')
  assert.equal(check?.level, 'warn')
  assert.equal(check?.titleParams?.names, 'Biblioteca de Informações')
  assert.equal(check?.action?.href, '/apps')
})

test('documentos oficiais na IA: lendo é informação, falha é aviso, prontos é ok', () => {
  const ai = (ready: number, failed = 0) => ({ ...healthy, references: { total: 7, available: 7, ai: { total: 7, ready, failed } } })
  assert.equal(level(ai(3), 'references-ai'), 'info')
  assert.equal(healthChecks(ai(3)).find((c) => c.id === 'references-ai')?.titleParams?.ready, 3)
  assert.equal(level(ai(6, 1), 'references-ai'), 'warn')
  assert.equal(level(ai(7), 'references-ai'), 'ok')
  // sem IA instalada, o item não aparece
  assert.equal(level({ ...healthy, references: { total: 7, available: 7, ai: null } }, 'references-ai'), undefined)
})

test('IA sem modelo manda para a tela de inteligência artificial', () => {
  const check = healthChecks({ ...healthy, ai: { installed: true, model: null } }).find((c) => c.id === 'ai')
  assert.equal(check?.action?.href, '/ia')
})

test('IA em outro endereço: ok se responde, problema se não responde', () => {
  const remote = (reachable: boolean, model: string | null = 'qwen3:8b'): HealthInput => ({
    ...healthy,
    ai: { installed: true, model, remote: { url: 'http://192.168.0.20:11434', reachable } },
  })
  const ok = healthChecks(remote(true)).find((c) => c.id === 'ai')
  assert.equal(ok?.level, 'ok')
  assert.equal(ok?.title, 'AI at another address')
  assert.equal(ok?.action?.href, '/ia')

  const down = healthChecks(remote(false, null)).find((c) => c.id === 'ai')
  assert.equal(down?.level, 'error')
  assert.equal(down?.detailParams?.url, 'http://192.168.0.20:11434')
  assert.equal(down?.action?.href, '/ia')

  assert.equal(level(remote(true, null), 'ai'), 'warn')
})

test('com IA em outro endereço, o contêiner local parado não conta como app parado', () => {
  const services = [
    { name: 'nomad_ollama', status: 'exited' },
    { name: 'nomad_flatnotes', status: 'exited' },
    { name: 'nomad_kiwix_server', status: 'running' },
  ]
  assert.deepEqual(
    stoppedServices(services, true).map((s) => s.name),
    ['nomad_flatnotes']
  )
  assert.deepEqual(
    stoppedServices(services, false).map((s) => s.name),
    ['nomad_ollama', 'nomad_flatnotes']
  )
})

test('conteúdo do Tropeiro: em dia é ok com botão; inválido é aviso; desenvolvimento é informação', () => {
  const item = (content: HealthInput['content']) => healthChecks({ ...healthy, content }).find((c) => c.id === 'content')
  const ok = item({ enabled: true, source: 'downloaded', updatedAt: '2026-10-06T12:00:00Z', lastResult: 'em-dia' })
  assert.equal(ok?.level, 'ok')
  assert.equal(ok?.detailParams?.date, '06/10/2026')
  assert.equal(ok?.action?.method, 'post')
  assert.equal(item({ enabled: true, source: 'bundled', lastResult: 'invalido' })?.level, 'warn')
  assert.equal(item({ enabled: false, source: 'bundled' })?.level, 'info')
  assert.equal(item(undefined), undefined)
})
