import * as assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cleanPageText,
  groupReferencePages,
  pagesToEmbed,
  referenceForPath,
  referenceHref,
  referenceLabel,
} from '../../app/utils/reference_pages.js'

test('rótulo e link do documento', () => {
  assert.equal(
    referenceLabel({ title: 'Manual de Primeiros Socorros', publisher: 'Ministério da Saúde', year: 2003 }),
    'Manual de Primeiros Socorros (Ministério da Saúde, 2003)'
  )
  assert.equal(referenceHref('ms-samu', 133), '/referencias/ms-samu#page=133')
  assert.equal(referenceHref('ms-samu'), '/referencias/ms-samu')
})

test('reconhece o arquivo do documento oficial', () => {
  const docs = [{ id: 'ms-samu' }, { id: 'ms-fiocruz' }]
  assert.deepEqual(referenceForPath(docs, '/x/storage/referencias/ms-samu.pdf'), { id: 'ms-samu' })
  assert.equal(referenceForPath(docs, '/x/storage/kb_uploads/ms-samu-copia.pdf'), null)
})

test('junta palavra quebrada no fim da linha e espaços', () => {
  assert.equal(cleanPageText('Resfriar a queima-\ndura   com água\n\n\ncorrente'), 'Resfriar a queimadura com água\ncorrente')
  // hífen de verdade, antes de maiúscula, fica
  assert.equal(cleanPageText('SAMU-\n192'), 'SAMU-\n192')
})

test('páginas quase vazias ficam de fora', () => {
  const pages = pagesToEmbed([
    { num: 1, text: 'Capa' },
    { num: 2, text: 'Em caso de queimadura, resfrie a área com água corrente em temperatura ambiente por vários minutos.' },
  ])
  assert.deepEqual(pages.map((p) => p.page), [2])
})

test('fontes do mesmo documento viram uma entrada com as páginas em ordem', () => {
  const grouped = groupReferencePages([
    { id: 'samu', label: 'SAMU', page: 134 },
    { id: 'samu', label: 'SAMU', page: 133 },
    { id: 'fiocruz', label: 'Fiocruz', page: 10 },
    { id: 'samu', label: 'SAMU', page: 133 },
  ])
  assert.deepEqual(grouped, [
    { id: 'samu', label: 'SAMU', pages: [133, 134] },
    { id: 'fiocruz', label: 'Fiocruz', pages: [10] },
  ])
})
