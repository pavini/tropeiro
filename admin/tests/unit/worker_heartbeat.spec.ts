import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isWorkerAlive,
  writeWorkerHeartbeat,
  WORKER_HEARTBEAT_STALE_MS,
} from '../../app/utils/worker_heartbeat.js'

function memoryStore() {
  const data = new Map<string, string>()
  return {
    data,
    async set(key: string, value: string) {
      data.set(key, value)
    },
    async get(key: string) {
      return data.get(key) ?? null
    },
  }
}

test('worker com sinal recente está vivo', async () => {
  const store = memoryStore()
  await writeWorkerHeartbeat(store, 1_000_000)
  assert.equal(await isWorkerAlive(store, 1_000_000 + 5_000), true)
})

test('sem sinal há mais que o limite, o worker está parado', async () => {
  const store = memoryStore()
  await writeWorkerHeartbeat(store, 1_000_000)
  assert.equal(await isWorkerAlive(store, 1_000_000 + WORKER_HEARTBEAT_STALE_MS + 1), false)
})

test('sem sinal nenhum, o worker está parado', async () => {
  assert.equal(await isWorkerAlive(memoryStore()), false)
})

test('Redis fora do ar: estado desconhecido, não "parado"', async () => {
  const broken = {
    async set() {},
    async get(): Promise<string | null> {
      throw new Error('ECONNREFUSED')
    },
  }
  assert.equal(await isWorkerAlive(broken), null)
})
