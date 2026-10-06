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
    audience: 'public',
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
    audience: 'professional',
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
    audience: 'public',
  },
  {
    id: 'ms-guia-animais-peconhentos-2024',
    title: 'Guia de Animais Peçonhentos do Brasil',
    publisher: 'Ministério da Saúde',
    year: 2024,
    url: 'https://bvsms.saude.gov.br/bvs/publicacoes/guia_animais_peconhentos_brasil.pdf',
    sha256: '83537defa5aa608377970014ac280584b329a328cd12eeed3b04ce07c4dee861',
    sizeBytes: 19959925,
    license:
      'Creative Commons Atribuição–NãoComercial–CompartilhaIgual 4.0. É permitida a reprodução parcial ou total desta obra, desde que citada a fonte.',
    audience: 'public',
  },
  {
    id: 'ms-caderneta-crianca-2024',
    title: 'Caderneta da Criança — Passaporte da Cidadania (7ª edição)',
    publisher: 'Ministério da Saúde',
    year: 2024,
    url: 'https://bvsms.saude.gov.br/bvs/publicacoes/caderneta_crianca_menino_passaporte_cidadania_7ed.pdf',
    sha256: '012aee4bb49de04e47238841c651c92927916ff6608b1b365ef8ec3ee44ccfe6',
    sizeBytes: 14656857,
    license:
      'Creative Commons Atribuição–NãoComercial–CompartilhaIgual 4.0. É permitida a reprodução parcial ou total desta obra, desde que citada a fonte.',
    audience: 'public',
  },
  {
    id: 'ms-manejo-diarreia-cartaz',
    title: 'Manejo do Paciente com Diarreia (cartaz)',
    publisher: 'Ministério da Saúde',
    year: 2014,
    url: 'https://bvsms.saude.gov.br/bvs/cartazes/manejo_paciente_diarreia_cartaz.pdf',
    sha256: 'b19a1f0ec04cec2b8ae280008af0b6d5bf93a35e42ce36cd11af2cccafbc9526',
    sizeBytes: 216456,
    license: 'Sem nota de licença no documento. As fichas usam texto próprio e citam a fonte.',
    audience: 'public',
  },
  {
    id: 'ms-orientacoes-enchentes',
    title: 'Orientações à População em Situação de Enchentes',
    publisher: 'Ministério da Saúde',
    year: 2024,
    url: 'https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/enchentes/orientacoes-a-populacao-em-situacao-de-enchentes.pdf',
    sha256: '93441d26f426c97db6776569015c1b2f137b2ef817d63b0cb6c4c0cbea15f24e',
    sizeBytes: 533260,
    license: 'Sem nota de licença no documento. As fichas usam texto próprio e citam a fonte.',
    audience: 'public',
  },
]
