import type { Ficha } from '../../types/fichas.js'

/**
 * Fichas de primeiros socorros: o "faça agora" para quem está diante de uma
 * emergência. Texto próprio, curto e para leigos, baseado nos documentos de
 * app/content/referencias.ts; cada ficha cita a fonte e a página.
 *
 * Nenhuma ficha foi revisada por profissional de saúde ainda (reviewed: false).
 * Ao mudar o conteúdo, conferir de novo na fonte citada.
 */
export const FICHAS: Ficha[] = [
  {
    slug: 'parada-cardiaca',
    title: 'Parada cardíaca: a pessoa não responde e não respira',
    summary: 'Ligue 192 e comece as compressões no meio do peito, sem parar.',
    keywords: ['parada cardíaca', 'parada cardiorrespiratória', 'rcp', 'massagem cardíaca', 'não respira', 'desacordado', 'infarto', 'ressuscitação', 'dea', 'desfibrilador'],
    callFirst: 'Ligue 192 agora, ou peça para alguém ligar e trazer um desfibrilador (DEA), se houver no local.',
    sections: [
      {
        kind: 'do',
        title: 'Como saber',
        items: [
          'Toque nos ombros e chame a pessoa em voz alta.',
          'Se ela não responde e não respira, ou só puxa o ar de vez em quando, comece já.',
        ],
      },
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Deite a pessoa de costas num lugar firme e plano, como o chão.',
          'Entrelace as mãos e apoie no centro do peito.',
          'Afunde o peito de 5 a 6 cm e deixe voltar por completo antes da próxima compressão.',
          'Faça de 100 a 120 compressões por minuto: duas por segundo, num ritmo firme.',
          'Se você tem treinamento, faça 30 compressões e 2 respirações. Se não tem, faça só as compressões, sem parar.',
          'Se houver mais alguém, revezem a cada 2 minutos para não perder a força.',
          'Quando o DEA chegar, ligue o aparelho e siga as instruções de voz. Na hora do choque, ninguém pode tocar na pessoa. Depois do choque, volte às compressões na hora.',
        ],
      },
      {
        kind: 'dont',
        items: ['Não pare as compressões, a não ser que o DEA peça ou a equipe do SAMU assuma.'],
      },
      {
        kind: 'help',
        title: 'Continue até',
        items: [
          'A equipe do SAMU chegar.',
          'A pessoa voltar a respirar, tossir ou se mexer.',
        ],
      },
    ],
    refs: [
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 37, about: 'Protocolo BC5: RCP em adultos (AHA 2015)' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 38, about: 'Compressões de boa qualidade e quando parar' },
    ],
    adaptation:
      'Adaptado para leigos: o protocolo do SAMU é para equipes com equipamento (bolsa-valva-máscara, oxigênio). A ficha mantém compressões, ritmo, profundidade e o uso do DEA, e indica só compressões para quem não tem treinamento.',
    reviewed: false,
  },
  {
    slug: 'engasgo',
    title: 'Engasgo',
    summary: 'Se a pessoa não consegue falar nem respirar, faça a manobra de Heimlich.',
    keywords: ['engasgo', 'engasgado', 'engasgada', 'sufocado', 'asfixia', 'heimlich', 'não consegue respirar', 'corpo estranho'],
    sections: [
      {
        kind: 'do',
        title: 'Se a pessoa tosse, fala ou respira',
        items: [
          'Não bata nas costas nem faça manobra.',
          'Acalme a pessoa e incentive a tossir com força.',
          'Fique ao lado observando. Se ela parar de conseguir falar ou respirar, faça a manobra abaixo.',
        ],
      },
      {
        kind: 'do',
        title: 'Se não consegue falar nem respirar (manobra de Heimlich)',
        items: [
          'Fique atrás da pessoa e passe os braços pela cintura dela.',
          'Feche uma das mãos e apoie, com o lado do polegar, na barriga, entre o umbigo e o fim do osso do peito.',
          'Segure essa mão com a outra e puxe com força, num movimento rápido para dentro e para cima.',
          'Repita até o objeto sair ou a pessoa desmaiar.',
          'Em gestante ou pessoa muito obesa, faça a pressão no meio do peito, na altura dos mamilos, em vez da barriga.',
        ],
      },
      {
        kind: 'help',
        title: 'Se a pessoa desmaiar',
        items: [
          'Ligue 192.',
          'Deite a pessoa de costas no chão e comece as compressões no peito, como na ficha de parada cardíaca.',
          'Olhe dentro da boca: tire o objeto só se ele estiver visível e ao alcance dos dedos.',
        ],
      },
    ],
    refs: [{ doc: 'ms-samu-suporte-basico-de-vida-2016', page: 33, about: 'Protocolo BC3: obstrução de vias aéreas por corpo estranho' }],
    adaptation:
      'Adaptado para leigos a partir do protocolo do SAMU para adultos. Bebês têm manobra diferente, que esta ficha não cobre.',
    reviewed: false,
  },
  {
    slug: 'sangramento',
    title: 'Sangramento e corte',
    summary: 'Aperte firme um pano limpo sobre o ferimento e não solte.',
    keywords: ['sangramento', 'hemorragia', 'corte', 'ferimento', 'sangue', 'machucado', 'torniquete', 'garrote'],
    sections: [
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Se puder, proteja as mãos com luvas ou um saco plástico.',
          'Coloque um pano limpo ou gaze direto sobre o ferimento e aperte firme com a mão.',
          'Mantenha a pressão sem soltar até o sangramento parar.',
          'Se o pano encharcar, não tire: coloque outro por cima e aperte com mais força.',
          'Quando parar, enfaixe firme com uma faixa ou tira de pano para manter a pressão.',
          'Se houver um objeto cravado, não tire: aperte dos lados dele.',
        ],
      },
      {
        kind: 'do',
        title: 'Se não parar, num braço ou numa perna (último recurso)',
        items: [
          'Faça um torniquete com uma faixa larga, de pelo menos 10 cm, logo acima do ferimento (entre o ferimento e o tronco).',
          'Aperte até o sangue parar por completo.',
          'Anote a hora em que colocou e avise a equipe de socorro.',
          'Não afrouxe depois de colocado: um torniquete frouxo aumenta o sangramento.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não tire objetos cravados no ferimento.',
          'Não tire o pano encharcado de cima do ferimento.',
        ],
      },
      {
        kind: 'help',
        title: 'Ligue 192 se',
        items: [
          'O sangue sai em jato ou não para com a pressão.',
          'Foi preciso fazer torniquete.',
          'A pessoa fica agitada, confusa, sonolenta ou suando muito: podem ser sinais de choque.',
        ],
      },
    ],
    refs: [
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 155, about: 'Protocolo BP8: compressão direta' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 157, about: 'Protocolo BP9: torniquete' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 68, about: 'Tipos de hemorragia e gravidade' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 136, about: 'Sinais de estado de choque' },
    ],
    adaptation:
      'Adaptado para leigos a partir dos protocolos do SAMU. O manual de 2003 ainda manda afrouxar o torniquete de tempos em tempos e usar pontos de pressão; a ficha segue o protocolo mais recente, que não faz isso.',
    reviewed: false,
  },
  {
    slug: 'queimadura',
    title: 'Queimadura',
    summary: 'Resfrie com bastante água limpa e não passe nada na pele.',
    keywords: ['queimadura', 'queimado', 'queimou', 'fogo', 'água fervente', 'escaldadura', 'bolha', 'óleo quente', 'chama'],
    sections: [
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Afaste a pessoa do que está queimando.',
          'Se a roupa pegar fogo: não deixe a pessoa correr. Deite no chão e abafe as chamas com cobertor, toalha ou casaco, ou faça a pessoa rolar no chão.',
          'Resfrie a área queimada com bastante água limpa, em temperatura ambiente.',
          'Tire anéis, relógio, pulseiras, cinto e roupas que não estejam grudados na pele, antes que a região inche.',
          'Cubra a queimadura com um pano limpo.',
          'Mantenha a pessoa aquecida com um cobertor: queimaduras grandes fazem o corpo perder calor.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não use gelo.',
          'Não passe pasta de dente, manteiga, margarina, óleo, pomada ou qualquer outra coisa.',
          'Não fure as bolhas.',
          'Não puxe roupa grudada na pele.',
          'Se a pessoa estiver desacordada, não dê nada para beber.',
        ],
      },
      {
        kind: 'help',
        title: 'Ligue 192 se',
        items: [
          'A queimadura é no rosto, nos olhos, nas mãos, nos pés ou nos genitais.',
          'Há bolhas, ou a pele ficou branca, escura ou sem dor.',
          'A queimadura pega uma área grande do corpo.',
          'Foi causada por eletricidade ou por produto químico.',
          'A queimadura no rosto aconteceu em lugar fechado, ou a pessoa passa a tossir fuligem ou ter falta de ar.',
          'É uma criança pequena, um idoso ou alguém com diabetes ou doença do coração.',
        ],
      },
    ],
    refs: [
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 133, about: 'Protocolo BT18: queimadura térmica' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 134, about: 'Não romper bolhas' },
      { doc: 'ms-cartilha-queimaduras-2012', page: 6, about: 'Tratamento imediato de emergência' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 135, about: 'Quando a queimadura é grave' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 136, about: 'Gelo, bolhas e o que não aplicar na pele' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 137, about: 'Fogo na roupa' },
    ],
    adaptation:
      'As fontes não concordam sobre por quanto tempo resfriar: o manual de 2003 fala em no máximo um minuto e o protocolo do SAMU em irrigar "em abundância", sem tempo. A ficha segue o SAMU e não indica tempo.',
    reviewed: false,
  },
  {
    slug: 'desmaio',
    title: 'Desmaio',
    summary: 'Deite a pessoa com as pernas mais altas que a cabeça e afrouxe a roupa.',
    keywords: ['desmaio', 'desmaiou', 'desmaiar', 'tontura', 'apagou', 'perdeu os sentidos', 'síncope', 'fraqueza', 'mal-estar'],
    sections: [
      {
        kind: 'do',
        title: 'Se está começando a passar mal',
        items: [
          'Sente a pessoa e incline o corpo dela para frente, com a cabeça mais baixa que os joelhos.',
          'Peça para respirar fundo até o mal-estar passar.',
        ],
      },
      {
        kind: 'do',
        title: 'Se desmaiou',
        items: [
          'Deite a pessoa de costas, com a cabeça e os ombros mais baixos que o resto do corpo (pernas levantadas).',
          'Afrouxe a roupa e deixe o lugar arejado.',
          'Se vomitar, vire a cabeça de lado para ela não engasgar.',
          'Depois que acordar, ela pode tomar água com açúcar, chá ou café.',
        ],
      },
      {
        kind: 'dont',
        items: ['Nunca dê bebida alcoólica.', 'Não dê nada para beber enquanto a pessoa estiver desacordada.'],
      },
      {
        kind: 'help',
        title: 'Ligue 192 se',
        items: [
          'A pessoa não acordar em até 2 minutos. Enquanto espera, mantenha-a agasalhada.',
          'Ela não respira ou só puxa o ar de vez em quando: veja a ficha de parada cardíaca.',
          'O desmaio veio depois de um acidente ou de perda de sangue.',
        ],
      },
      {
        kind: 'help',
        title: 'Depois',
        items: ['Mesmo que a pessoa fique bem, procure um serviço de saúde para descobrir a causa do desmaio.'],
      },
    ],
    refs: [
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 106, about: 'Desmaio: causas e sintomas' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 107, about: 'Primeiros socorros no desmaio' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 108, about: 'Quando procurar atendimento' },
    ],
    adaptation:
      'O manual manda procurar o serviço de saúde interno da Fiocruz; a ficha troca por ligar para o SAMU 192 e procurar um serviço de saúde.',
    reviewed: false,
  },
]
