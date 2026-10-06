import type { ReferenceDoc } from '../../types/fichas.js'

/**
 * Documentos oficiais em que as fichas de primeiros socorros se baseiam. O
 * servidor baixa cada um da fonte oficial quando tem internet, confere o sha256
 * e guarda em storage/referencias, para a consulta funcionar offline. Os PDFs
 * não ficam no repositório.
 */
export const REFERENCE_DOCS: ReferenceDoc[] = [
  {
    id: 'ms-fiocruz-primeiros-socorros-2003',
    title: 'Manual de Primeiros Socorros',
    publisher: 'Ministério da Saúde / Fundação Oswaldo Cruz (FIOCRUZ)',
    year: 2003,
    url: 'https://bvsms.saude.gov.br/bvs/publicacoes/manual_primeiros_socorros.pdf',
    sha256: '4f110686a10c4e1ecf847397f40340d2df92ad106262729ce524a903bb3d76f2',
    sizeBytes: 9549199,
    license: 'É permitida a reprodução parcial ou total desta obra, desde que citada a fonte.',
  },
  {
    id: 'ms-samu-suporte-basico-de-vida-2016',
    title: 'Protocolos de Suporte Básico de Vida — SAMU 192',
    publisher: 'Ministério da Saúde',
    year: 2016,
    url: 'https://bvsms.saude.gov.br/bvs/publicacoes/protocolo_suporte_basico_vida.pdf',
    sha256: 'f39edb612b1713ce9027ec58818146342265353ed3aecd8166c2a8c97f90d058',
    sizeBytes: 16541991,
    license:
      'Sem autorização de reprodução explícita; os protocolos dizem que "adaptações são permitidas de acordo com as particularidades dos serviços". As fichas usam texto próprio e citam a fonte.',
  },
  {
    id: 'ms-cartilha-queimaduras-2012',
    title: 'Cartilha para tratamento de emergência das queimaduras',
    publisher: 'Ministério da Saúde',
    year: 2012,
    url: 'https://bvsms.saude.gov.br/bvs/publicacoes/cartilha_tratamento_emergencia_queimaduras.pdf',
    sha256: '4b69e98c9886a39dbfd9139db4403f95b10da35313c20034c0aced350bc79a92',
    sizeBytes: 2598199,
    license:
      'É permitida a reprodução parcial ou total desta obra, desde que citada a fonte e que não seja para venda ou qualquer fim comercial.',
  },
]
