import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { healthChecks, overallLevel, type HealthInput } from '../../inertia/novo/serverHealth.js'

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
