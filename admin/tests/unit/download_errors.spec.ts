import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import { permanentDownloadError } from '../../app/utils/download_errors.js'

const http = (status: number) => ({ response: { status } })

test('arquivo que sumiu ou fonte que recusa: falha na hora, com motivo em português', () => {
  assert.match(permanentDownloadError(http(404))!, /não existe mais na fonte/)
  assert.match(permanentDownloadError(http(410))!, /HTTP 410/)
  assert.match(permanentDownloadError(http(403))!, /recusou o download/)
  assert.match(permanentDownloadError(http(400))!, /HTTP 400/)
})

test('o que passa com o tempo continua sendo tentado de novo', () => {
  for (const status of [408, 429, 500, 502, 503]) assert.equal(permanentDownloadError(http(status)), null, `HTTP ${status}`)
  assert.equal(permanentDownloadError(new Error('ECONNRESET')), null, 'queda de conexão')
  assert.equal(permanentDownloadError(null), null)
})
