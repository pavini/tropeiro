import type { Guide } from '../../../types/guias.js'

/**
 * Trilha "Comunicação por rádio". Texto próprio, em linguagem simples; cada
 * regra, frequência ou potência vem das normas da Anatel guardadas no servidor
 * (app/content/referencias.ts). Nada aqui foi revisado por radioamador ainda.
 */

const CARTILHA = 'anatel-cartilha-radioamador-2026'
const ATO_14448 = 'anatel-ato-14448-2017'
const RES_680 = 'anatel-resolucao-680-2017'
const LGT = 'lei-9472-1997'
const ATO_3445 = 'anatel-ato-3445-2026'
const RGST = 'anatel-resolucao-777-2025'
const RES_444 = 'anatel-resolucao-444-2006-revogada'
const GOVBR_PX = 'govbr-servico-radio-do-cidadao'
const RES_789 = 'anatel-resolucao-789-2026'

export const RADIO_GUIDES: Guide[] = [
  {
    slug: 'radio-como-funciona',
    track: 'radio',
    order: 1,
    title: 'Como o rádio funciona',
    summary:
      'Frequência, faixas, por que um rádio alcança longe e outro não, e o que é uma repetidora. A base para entender todo o resto.',
    keywords: ['rádio', 'radio', 'frequência', 'onda', 'VHF', 'UHF', 'HF', 'alcance', 'antena', 'repetidora', 'propagação', 'modulação', 'FM', 'AM'],
    sections: [
      {
        title: 'O que é uma onda de rádio',
        blocks: [
          {
            kind: 'text',
            text: 'O rádio transmite a sua voz pelo ar usando uma onda invisível. Essa onda se repete muitas vezes por segundo. O número de repetições por segundo é a frequência, medida em hertz (Hz). Um megahertz (MHz) é um milhão de repetições por segundo.',
          },
          {
            kind: 'text',
            text: 'Cada onda também tem um comprimento: a distância que ela percorre em uma repetição. Quanto maior a frequência, menor a onda. Uma conta prática: comprimento em metros ≈ 300 ÷ frequência em MHz. Por isso se fala em "faixa de 2 metros" para perto de 146 MHz.',
          },
          {
            kind: 'note',
            text: 'Para conversar, os dois rádios precisam estar na mesma frequência. É como combinar o mesmo canal.',
          },
        ],
      },
      {
        title: 'As faixas de frequência',
        blocks: [
          {
            kind: 'text',
            text: 'As frequências são divididas em faixas com nomes. Cada faixa se comporta de um jeito, e isso decide até onde a sua voz chega.',
          },
          {
            kind: 'table',
            caption: 'Faixas mais usadas em comunicação por rádio',
            columns: ['Faixa', 'Frequências', 'Como a onda viaja', 'Uso típico'],
            rows: [
              ['MF', '0,3 a 3 MHz', 'Rente ao chão, acompanhando a curva da Terra', 'Alcance moderado'],
              ['HF', '3 a 30 MHz', 'Rebate no alto da atmosfera (ionosfera) e volta', 'Longas distâncias, outros estados e países'],
              ['VHF', '30 a 300 MHz', 'Em linha reta entre as antenas', 'Uso local e regional, repetidoras'],
              ['UHF', '300 a 3.000 MHz', 'Em linha reta entre as antenas', 'Uso local, rádios portáteis, repetidoras'],
            ],
            note: 'Valores aproximados, da Cartilha do Serviço Radioamador da Anatel.',
          },
        ],
      },
      {
        title: 'Por que um rádio alcança longe e outro não',
        blocks: [
          {
            kind: 'text',
            text: 'Em VHF e UHF, a onda vai praticamente em linha reta de uma antena até a outra. Morro, prédio e a própria curva da Terra bloqueiam o sinal. Por isso a altura da antena faz tanta diferença: quanto mais alto, mais longe ela "enxerga".',
          },
          {
            kind: 'text',
            text: 'Em HF, a onda sobe, rebate na ionosfera (uma camada de 60 a 400 km de altura) e volta para a Terra muito longe, às vezes em vários saltos, alcançando milhares de quilômetros. Só que isso muda com a hora do dia, a estação do ano e o ciclo do Sol: uma frequência que funciona de manhã pode não funcionar à noite.',
          },
          {
            kind: 'list',
            items: [
              'Antena boa e bem instalada ajuda mais do que aumentar a potência.',
              'Use a menor potência que mantenha a conversa: gasta menos bateria e atrapalha menos os outros.',
              'Cabos e conectores em bom estado evitam perder sinal no caminho.',
              'Aparelhos eletrônicos, lâmpadas e fontes com defeito geram ruído que atrapalha a recepção.',
            ],
          },
        ],
      },
      {
        title: 'Como a voz vai dentro da onda (modulação)',
        blocks: [
          {
            kind: 'text',
            text: 'O transmissor gera uma onda firme, chamada portadora, e "imprime" a sua voz nela. A Anatel compara: a voz é a carta, a portadora é o envelope com endereço, e o sinal transmitido é o envelope postado. Os jeitos mais comuns de imprimir a voz:',
          },
          {
            kind: 'list',
            items: [
              'FM (frequência modulada): o mais usado em VHF e UHF, nos rádios portáteis e nas repetidoras.',
              'AM (amplitude modulada): a força da onda varia com a voz.',
              'SSB (faixa lateral única): uma variação do AM muito usada em HF para longas distâncias.',
              'CW (telegrafia): a onda liga e desliga em pontos e traços, o código Morse.',
            ],
          },
          {
            kind: 'note',
            text: 'Dois rádios na mesma frequência mas em modos diferentes (um em FM, outro em AM) não se entendem direito.',
          },
        ],
      },
      {
        title: 'Simplex e repetidora',
        blocks: [
          {
            kind: 'text',
            text: 'No modo simplex, os dois rádios falam e escutam na mesma frequência, direto um com o outro. É simples, mas o alcance depende de os dois se "enxergarem".',
          },
          {
            kind: 'text',
            text: 'Uma repetidora é uma estação instalada num lugar alto que escuta numa frequência (a entrada) e retransmite na hora em outra (a saída). Assim, dois rádios que não se alcançariam conseguem conversar pela repetidora. No rádio, você ajusta a frequência de recepção e o deslocamento (em inglês, "shift") até a frequência em que transmite.',
          },
          {
            kind: 'list',
            items: [
              'Escute antes de falar: pode haver uma conversa ou uma emergência em andamento.',
              'Fale pouco e deixe pausas: a repetidora tem tempo máximo de transmissão e outros podem precisar dela.',
              'Repetidoras de radioamador são para radioamadores licenciados (veja a aula sobre a licença).',
            ],
          },
        ],
      },
    ],
    refs: [
      { doc: CARTILHA, page: 29, about: 'frequência, comprimento de onda e designação das faixas' },
      { doc: CARTILHA, page: 30, about: 'faixas VHF e UHF; mensagem, portadora e modulação AM e SSB' },
      { doc: CARTILHA, page: 31, about: 'FM em VHF/UHF e CW' },
      { doc: CARTILHA, page: 32, about: 'ondas terrestres e espaciais, ionosfera e mecanismo de cada faixa' },
      { doc: CARTILHA, page: 33, about: 'HF varia com hora, estação e ciclo solar; como melhorar a recepção' },
      { doc: CARTILHA, page: 34, about: 'operar com a menor potência necessária' },
      { doc: CARTILHA, page: 26, about: 'transceptor e repetidoras em VHF/UHF' },
      { doc: CARTILHA, page: 27, about: 'tempo da repetidora e operação com deslocamento (shift)' },
    ],
    reviewed: false,
  },
  {
    slug: 'radio-sem-licenca',
    track: 'radio',
    order: 2,
    title: 'Rádios que qualquer pessoa pode usar',
    summary:
      'O rádio de uso geral (walkie-talkie de 462 e 467 MHz), que dispensa licença, e o Rádio do Cidadão (PX, 27 MHz), que só pede um cadastro gratuito. Canais, potência e regras de conduta.',
    keywords: ['walkie-talkie', 'walkie talkie', 'radinho', 'rádio comunicador', 'uso geral', 'sem licença', 'canais', '462', 'PX', 'faixa do cidadão', 'rádio do cidadão', '27 MHz', 'Mosaico', 'canal 9', 'canal 19'],
    sections: [
      {
        title: 'Rádio de uso geral (walkie-talkie): sem licença',
        blocks: [
          {
            kind: 'text',
            text: 'É o rádio portátil vendido em loja para conversa de voz entre duas pessoas. Ele não precisa de licença nem de cadastro: a lei dispensa autorização para equipamentos de "radiação restrita", e este é um deles. A condição é que o aparelho seja certificado pela Anatel.',
          },
          {
            kind: 'list',
            items: [
              'Potência máxima: 0,5 W (500 mW).',
              'Funciona só nas frequências da tabela abaixo, em canais de até 12,5 kHz.',
              'Use a antena que veio com o rádio.',
              'Não tem proteção contra interferência: outros podem usar o mesmo canal.',
              'Não pode ser ligado à rede de telefone ou de internet.',
            ],
          },
          {
            kind: 'note',
            text: 'Em qualquer canal e a qualquer momento, mensagem de emergência sobre risco à vida tem prioridade. Se ouvir um pedido de socorro, pare de falar e ajude.',
          },
        ],
      },
      {
        title: 'Os 26 canais do rádio de uso geral',
        blocks: [
          {
            kind: 'table',
            caption: 'Canais e frequências (Anatel, Ato 14.448, item 15)',
            columns: ['Canal', 'Frequência (MHz)', 'Canal', 'Frequência (MHz)'],
            rows: [
              ['1', '462,5625', '14', '467,5625'],
              ['2', '462,5750', '15', '467,5750'],
              ['3', '462,5875', '16', '467,5875'],
              ['4', '462,6000', '17', '467,6000'],
              ['5', '462,6125', '18', '467,6125'],
              ['6', '462,6250', '19', '467,6250'],
              ['7', '462,6375', '20', '467,6375'],
              ['8', '462,6500', '21', '467,6500'],
              ['9', '462,6625', '22', '467,6625'],
              ['10', '462,6750', '23', '467,6750'],
              ['11', '462,6875', '24', '467,6875'],
              ['12', '462,7000', '25', '467,7000'],
              ['13', '462,7125', '26', '467,7125'],
            ],
            note: 'Um rádio comprado em outro país pode numerar os canais de outro jeito. Na dúvida, combine pela frequência, não pelo número.',
          },
          {
            kind: 'text',
            text: 'Muitos rádios têm "códigos de privacidade" (tons abaixo de 300 Hz enviados junto com a voz). Eles só fazem o seu rádio ignorar quem não usa o mesmo código. Não deixam a conversa secreta: qualquer um no mesmo canal, sem código, escuta tudo.',
          },
          {
            kind: 'text',
            text: 'Transmitir sem esperar resposta só é permitido para chamar alguém, mandar uma mensagem de emergência, ajudar um viajante ou fazer um teste rápido.',
          },
        ],
      },
      {
        title: 'Rádio do Cidadão (PX, 27 MHz): só um cadastro gratuito',
        blocks: [
          {
            kind: 'text',
            text: 'O PX é um serviço de rádio para comunicação de interesse geral ou particular e para atender situações de emergência ou de perigo para a vida, a saúde ou a propriedade. Usa a faixa de 27 MHz, perto do fim do HF. Por isso, de vez em quando, o sinal vai muito longe rebatendo na ionosfera, conforme a hora e o ciclo do Sol.',
          },
          {
            kind: 'list',
            ordered: true,
            items: [
              'Faça o cadastro de "Dispensa de Autorização" no Sistema Mosaico da Anatel. É gratuito.',
              'Para entrar no Mosaico é preciso uma conta gov.br nível Prata ou Ouro.',
              'Você recebe um indicativo de chamada começando com PX, seguido do número da região e de letras e números (exemplo de formato: PX2A1234 em São Paulo).',
              'Use um rádio PX homologado pela Anatel.',
            ],
          },
          {
            kind: 'text',
            text: 'Quem pode: maiores de 18 anos; de 10 a 18 anos, com pedido feito pelo responsável; entidades sem fins lucrativos; e órgãos públicos como bombeiros e polícias. Radioamadores licenciados podem usar o PX sem cadastro, com o próprio indicativo.',
          },
        ],
      },
      {
        title: 'Regras de conduta no PX',
        blocks: [
          {
            kind: 'list',
            ordered: true,
            items: [
              'Antes de transmitir, escute para ver se o canal está livre.',
              'Chame no máximo três vezes seguidas e passe a escutar.',
              'Na conversa, diga o indicativo das duas estações.',
              'Cada conversa dura no máximo 10 minutos, exceto em emergência.',
              'Em qualquer canal, dê prioridade a quem está em emergência e deixe intervalos entre as falas para permitir pedidos de socorro.',
              'Use o código Q (só as séries QRA a QUZ) e o alfabeto fonético internacional.',
              'Você responde pela sua estação, mesmo quando outra pessoa a usa.',
            ],
          },
          {
            kind: 'note',
            text: 'O PX não pode ser usado para trabalho de empresas de logística e transporte com seus motoristas.',
          },
        ],
      },
      {
        title: 'Existe canal de emergência no PX?',
        blocks: [
          {
            kind: 'text',
            text: 'Hoje, nenhuma norma em vigor reserva um canal do PX para emergência: a Anatel ainda não publicou a tabela de canais na regra atual. Por costume, muita gente usa o canal 9 (27,065 MHz) para emergência e o canal 19 (27,185 MHz) na estrada, porque era assim na norma antiga (Resolução 444/2006, já revogada). Numa emergência, chame no canal 9, mas lembre que em qualquer canal quem está em emergência tem prioridade.',
          },
          {
            kind: 'text',
            text: 'O plano de faixas atual da Anatel destina ao PX a faixa de 26,960 a 27,500 MHz, e de 27,500 a 27,860 MHz ele divide o espaço com outros serviços.',
          },
          {
            kind: 'table',
            caption: 'Canais especiais por costume (vêm da norma antiga, revogada)',
            columns: ['Canal', 'Frequência (MHz)', 'Uso por costume'],
            rows: [
              ['9', '27,065', 'Emergência'],
              ['11', '27,085', 'Chamada e escuta'],
              ['19', '27,185', 'Rodovias'],
            ],
            note: 'Resolução Anatel 444/2006, art. 11 (revogada): não é regra de hoje.',
          },
        ],
      },
      {
        title: 'Qual escolher numa emergência',
        blocks: [
          {
            kind: 'table',
            columns: ['', 'Rádio de uso geral', 'Rádio do Cidadão (PX)'],
            rows: [
              ['Precisa de quê', 'Nada: só o rádio certificado', 'Cadastro gratuito no Mosaico (conta gov.br Prata ou Ouro)'],
              ['Frequências', '462 e 467 MHz (UHF), 26 canais', 'Por volta de 27 MHz (26,960 a 27,860 MHz)'],
              ['Potência', 'Até 0,5 W', 'Conforme o equipamento homologado'],
              ['Alcance', 'Curto: precisa de linha reta entre as antenas', 'Maior; às vezes muito longe pela ionosfera'],
              ['Bom para', 'Família, vizinhos, grupo andando junto', 'Bairro, estrada, contato com outras cidades'],
            ],
          },
          {
            kind: 'text',
            text: 'Combine com a família e os vizinhos, antes de precisar, um canal e um horário para se falar se o celular cair. Teste com frequência e mantenha as baterias carregadas.',
          },
        ],
      },
    ],
    refs: [
      { doc: LGT, anchor: 'Independerão de outorga', about: 'equipamento de radiação restrita dispensa autorização (art. 163, § 2º, I)' },
      { doc: RES_680, anchor: 'devem possuir certificação emitida ou aceita pela Anatel', about: 'certificação obrigatória (art. 4º)' },
      { doc: RES_680, anchor: 'não têm direito à proteção contra interferências prejudiciais', about: 'sem proteção contra interferência (art. 3º)' },
      { doc: RES_680, anchor: 'seja utilizada apenas a antena comercializada com o equipamento', about: 'usar a antena que veio com o equipamento (art. 6º)' },
      { doc: ATO_14448, anchor: '15.1.3. A potência efetivamente radiada', about: 'canais, potência de 500 mW e largura de 12,5 kHz (item 15.1)' },
      { doc: ATO_14448, anchor: 'Estabelecer comunicação com outra pessoa', about: 'quando é permitido transmitir sem esperar resposta (item 15.1.7)' },
      { doc: ATO_14448, anchor: 'Em hipótese alguma é permitida a interconexão', about: 'proibido ligar à rede de telefone ou internet (item 15.1.9)' },
      { doc: ATO_14448, anchor: 'deve ser dada prioridade a mensagens de comunicação de emergência', about: 'prioridade para emergência (item 15.1.10)' },
      { doc: RGST, anchor: 'O Serviço Rádio do Cidadão é o serviço de telecomunicações de interesse restrito', about: 'o que é o PX (art. 27)' },
      { doc: RGST, anchor: 'somente poderão explorar o Serviço de Rádio do Cidadão', about: 'quem pode usar o PX (art. 286)' },
      { doc: RGST, anchor: 'com o mesmo indicativo de chamada', about: 'radioamador no PX (art. 287)' },
      { doc: ATO_3445, anchor: 'verificará se o canal está livre', about: 'regras de conduta (item 4.3)' },
      { doc: ATO_3445, anchor: 'Dispensa de Autorização', about: 'cadastro e indicativo (item 5.1.1)' },
      { doc: ATO_3445, anchor: 'composto do prefixo PX', about: 'formato do indicativo PX (item 5.4.3)' },
      { doc: ATO_3445, anchor: 'deve dar prioridade às estações efetuando comunicações de emergência', about: 'prioridade para emergência (item 5.3.1)' },
      { doc: ATO_3445, anchor: 'Código Q (somente Séries QRA a QUZ)', about: 'código Q e alfabeto fonético (item 5.3.2)' },
      { doc: ATO_3445, anchor: 'não se caracterizam como Serviço de Rádio do Cidadão', about: 'proibido para logística e transporte (item 5.1.2)' },
      { doc: GOVBR_PX, anchor: 'Prata ou Ouro', about: 'conta gov.br exigida para o cadastro' },
      { doc: RES_789, anchor: '26960-27500', about: 'faixa destinada ao Rádio do Cidadão no plano de faixas atual' },
      { doc: RES_444, anchor: 'O canal 9 é restrito ao tráfego de mensagens referentes a situações de emergência', about: 'canais 9, 11 e 19 na norma antiga (art. 11, revogada)' },
      { doc: CARTILHA, page: 33, about: 'HF varia com a hora e o ciclo solar' },
    ],
    reviewed: false,
  },
]
