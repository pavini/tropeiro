import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { appInfo, appState, groupApps, type NovoApp } from '../../inertia/novo/apps.js'

const app = (patch: Partial<NovoApp>): NovoApp => ({
  name: 'nomad_flatnotes',
  label: 'Notes',
  description: 'Simple note-taking app with local storage',
  isCustom: false,
  installed: true,
  installation: 'idle',
  status: 'running',
  uiLocation: '8200',
  customUrl: null,
  ...patch,
})

test('estado do app', () => {
  assert.equal(appState(app({})), 'running')
  assert.equal(appState(app({ status: 'exited' })), 'stopped')
  assert.equal(appState(app({ status: 'restarting' })), 'starting')
  assert.equal(appState(app({ installation: 'installing', installed: false })), 'installing')
  assert.equal(appState(app({ installed: false })), 'available')
  assert.equal(appState(app({ installed: false, installation: 'error' })), 'failed')
})

test('biblioteca e IA abrem dentro da interface nova', () => {
  assert.equal(appInfo(app({ name: 'nomad_kiwix_server' })).href, '/novo')
  assert.equal(appInfo(app({ name: 'nomad_ollama' })).href, '/novo/perguntar')
  assert.equal(appInfo(app({})).href, undefined)
})

test('app próprio mostra o nome cadastrado, sem tradução', () => {
  const info = appInfo(app({ name: 'meu_app', label: 'Rádio da vila', isCustom: true }))
  assert.equal(info.title, 'Rádio da vila')
  assert.equal(info.group, 'own')
  assert.equal(info.translated, false)
})

test('app do catálogo desconhecido cai em ferramentas com o nome original', () => {
  const info = appInfo(app({ name: 'nomad_novo_app', label: 'New App' }))
  assert.equal(info.title, 'New App')
  assert.equal(info.group, 'tools')
})

test('grupos na ordem da tela, sem grupos vazios', () => {
  const groups = groupApps([
    app({ name: 'nomad_it_tools' }),
    app({ name: 'nomad_kiwix_server' }),
    app({ name: 'x', isCustom: true }),
  ])
  assert.deepEqual(
    groups.map((g) => g.group),
    ['essentials', 'tools', 'own']
  )
})
