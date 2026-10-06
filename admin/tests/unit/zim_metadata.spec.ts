import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Archive } from '@openzim/libzim'
import { readZimMetadata } from '../../app/utils/zim_metadata.js'

/**
 * Simula um ZIM: na libzim real, getMetadata de uma chave ausente derruba o
 * processo. Aqui ela lança, e o teste falha se a chave for pedida.
 */
function fakeArchive(meta: Record<string, string>) {
  const asked: string[] = []
  const archive = {
    metadataKeys: Object.keys(meta),
    getMetadata(key: string) {
      asked.push(key)
      if (!(key in meta)) throw new Error(`chave ausente pedida: ${key}`)
      return meta[key]
    },
  }
  return { archive: archive as unknown as Archive, asked }
}

test('lê metadados que existem', () => {
  const { archive } = fakeArchive({ Title: 'Guia', Language: 'por' })
  assert.equal(readZimMetadata(archive, 'Title'), 'Guia')
  assert.equal(readZimMetadata(archive, 'Language'), 'por')
})

test('nunca pede à libzim uma chave que o arquivo não tem', () => {
  const { archive, asked } = fakeArchive({ Title: 'Guia' })
  assert.equal(readZimMetadata(archive, 'Flavour'), undefined)
  assert.deepEqual(asked, [])
})

test('valor vazio vira undefined', () => {
  const { archive } = fakeArchive({ Description: '' })
  assert.equal(readZimMetadata(archive, 'Description'), undefined)
})
