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
  {
    slug: 'ferimento-a-tiro',
    title: 'Ferimento a tiro',
    summary: 'Proteja-se primeiro. Depois, aperte firme onde sangra e não vede ferida no peito.',
    keywords: ['tiro', 'baleado', 'baleada', 'bala perdida', 'arma de fogo', 'disparo', 'projétil', 'ferimento a bala', 'levou um tiro'],
    callFirst: 'Ligue 190 (Polícia) e 192 (SAMU). Só se aproxime quando o local estiver seguro.',
    sections: [
      {
        kind: 'do',
        title: 'Antes de socorrer',
        items: [
          'Se ainda há risco (quem atirou por perto, confusão), fique num lugar seguro e espere a polícia. Sua segurança vem primeiro.',
          'Não toque na arma. Se ela estiver perto e alguém puder usá-la, afaste segurando só pelo cabo, sem tentar descarregar nem travar.',
        ],
      },
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Procure todos os ferimentos: pode haver mais de um, inclusive nas costas.',
          'Onde sangra, coloque um pano limpo e aperte firme, sem soltar (veja a ficha de sangramento).',
          'Num braço ou numa perna que não para de sangrar, faça um torniquete e anote a hora.',
          'Ferida no peito: cubra de leve com um pano limpo, sem vedar. Não tape com plástico nem fita. Se a respiração piorar, tire o que estiver por cima.',
          'Ferida na barriga: se algo estiver saindo, não empurre de volta para dentro. Cubra com um pano limpo umedecido.',
          'Mantenha a pessoa deitada e coberta com um cobertor.',
          'Se a pessoa caiu ou pode ter machucado o pescoço ou as costas, mexa nela o mínimo possível.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não tire a bala nem objetos cravados.',
          'Não dê nada para beber ou comer.',
          'Não limpe o local nem mexa em objetos além do necessário para socorrer: a polícia vai precisar deles.',
        ],
      },
      {
        kind: 'help',
        title: 'Se a pessoa parar de responder e de respirar',
        items: ['Comece as compressões no peito, como na ficha de parada cardíaca.'],
      },
    ],
    refs: [
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 222, about: 'Protocolo PE1: segurança de cena' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 260, about: 'Protocolo PE17: armas e indícios de crime' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 155, about: 'Protocolo BP8: compressão direta' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 157, about: 'Protocolo BP9: torniquete' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 113, about: 'Protocolo BT8: ferimento aberto no tórax' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 115, about: 'Protocolo BT9: ferimento aberto no abdome' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 71, about: 'Não dar líquidos com suspeita de lesão no abdome' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 136, about: 'Cobertor para prevenir o estado de choque' },
    ],
    adaptation:
      'Adaptado para leigos. Na ferida do peito, o protocolo do SAMU usa um curativo de plástico preso em 3 lados, técnica de equipe treinada que sabe quando soltá-lo; mal feito, ele pode piorar a respiração. A ficha orienta cobrir sem vedar.',
    reviewed: false,
  },
  {
    slug: 'convulsao',
    title: 'Convulsão',
    summary: 'Proteja a cabeça, afaste o que pode machucar e não coloque nada na boca.',
    keywords: ['convulsão', 'convulsionando', 'ataque epiléptico', 'epilepsia', 'crise convulsiva', 'tremendo', 'se debatendo', 'espuma na boca'],
    sections: [
      {
        kind: 'do',
        title: 'Durante a crise',
        items: [
          'Evite que a pessoa caia de qualquer jeito: deite-a no chão com cuidado, protegendo a cabeça.',
          'Afaste objetos com que ela possa se machucar e tire-a de perto de escada, vidro, fogo ou máquina.',
          'Afrouxe a roupa no pescoço e na cintura.',
          'Vire o rosto dela de lado, para a saliva ou o vômito escorrerem.',
          'Veja no relógio quanto tempo a crise dura.',
        ],
      },
      {
        kind: 'do',
        title: 'Depois da crise',
        items: [
          'Deixe a pessoa deitada de lado até ela recuperar a consciência por completo.',
          'Se ela quiser dormir, deixe. Fique por perto.',
          'Veja se ela se machucou na queda.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não segure nem tente parar os movimentos.',
          'Não coloque nada na boca: nem pano, nem colher, nem o dedo.',
          'Não jogue água no rosto.',
        ],
      },
      {
        kind: 'help',
        title: 'Ligue 192 se',
        items: [
          'A crise passa de 5 minutos.',
          'Vem uma crise atrás da outra sem a pessoa acordar entre elas.',
          'A pessoa se machucou.',
        ],
      },
      {
        kind: 'help',
        title: 'Depois',
        items: ['Mesmo que a pessoa fique bem, procure um serviço de saúde para investigar a causa.'],
      },
    ],
    refs: [
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 59, about: 'Protocolo BC16: crise convulsiva no adulto' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 109, about: 'Primeiros socorros na convulsão' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 110, about: 'Depois da crise' },
    ],
    adaptation:
      'O manual de 2003 sugere pôr um pano entre os dentes para a pessoa não morder a língua. O protocolo do SAMU, mais recente, alerta contra essas medidas, pelo risco de ferir a boca e os dentes; a ficha orienta não colocar nada na boca.',
    reviewed: false,
  },
  {
    slug: 'choque-eletrico',
    title: 'Choque elétrico',
    summary: 'Desligue a energia antes de tocar na pessoa.',
    keywords: ['choque elétrico', 'choque', 'eletricidade', 'eletrocutado', 'fio desencapado', 'tomada', 'raio', 'fio caído'],
    callFirst: 'Não toque na pessoa enquanto ela estiver ligada à corrente elétrica.',
    sections: [
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Desligue a energia: a chave geral, o disjuntor, ou puxe o fio da tomada (só se o fio estiver encapado).',
          'Se não der para desligar, afaste a pessoa do fio ou do aparelho usando algo seco que não conduza eletricidade: cabo de vassoura de madeira, tapete de borracha, jornal ou pano grosso dobrado, corda.',
          'Se for fio da rua (rede de poste) caído, não chegue perto: fique longe e ligue 193.',
          'Se a pessoa não responde e não respira, comece as compressões no peito (ficha de parada cardíaca) e não pare até a ajuda chegar.',
          'Depois, procure queimaduras e ferimentos da queda.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não toque na pessoa antes de separá-la da corrente.',
          'Não use nada molhado ou de metal para afastar: a umidade aumenta muito o perigo.',
        ],
      },
      {
        kind: 'help',
        title: 'Ligue 192',
        items: [
          'Sempre, mesmo que a pessoa pareça bem: a queimadura elétrica pode ser mais funda do que parece e o choque pode afetar o coração.',
        ],
      },
    ],
    refs: [
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 105, about: 'Desligar a corrente e afastar a vítima' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 106, about: 'Não tocar antes de separar; ressuscitação' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 140, about: 'Queimaduras por eletricidade' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 222, about: 'Protocolo PE1: rede elétrica e segurança de cena' },
    ],
    adaptation:
      'O manual fala em retirar os fusíveis; a ficha usa disjuntor, que é o equivalente nas instalações atuais. A orientação sobre fio de poste vem da segurança de cena do SAMU.',
    reviewed: false,
  },
  {
    slug: 'fratura',
    title: 'Fratura (osso quebrado)',
    summary: 'Imobilize na posição em que está, sem tentar pôr o osso no lugar.',
    keywords: ['fratura', 'osso quebrado', 'quebrou', 'quebrou o braço', 'quebrou a perna', 'fratura exposta', 'tala', 'torceu', 'luxação'],
    sections: [
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Se houver sangramento, controle primeiro com um pano limpo e pressão.',
          'Acalme a pessoa.',
          'Imobilize na posição em que está, ou na que doer menos. Não force.',
          'Para uma tala improvisada, use tábua, papelão, revista enrolada ou jornal grosso dobrado, longa o bastante para passar das juntas acima e abaixo do machucado.',
          'Forre com pano e amarre com tiras em pelo menos quatro pontos, sem apertar a ponto de prender a circulação.',
          'Depois de imobilizar, confira se a mão ou o pé continua com cor e temperatura normais.',
        ],
      },
      {
        kind: 'do',
        title: 'Se o osso está aparecendo (fratura exposta)',
        items: [
          'Não toque no osso e não tente pôr de volta para dentro.',
          'Cubra com um pano limpo e seco, sem apertar o osso.',
          'Imobilize do mesmo jeito.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não tente colocar o osso no lugar.',
          'Não mova a pessoa antes de imobilizar, a não ser que ela esteja em perigo onde está.',
        ],
      },
      {
        kind: 'help',
        title: 'Ligue 192 se',
        items: [
          'O osso está aparecendo ou há sangramento forte.',
          'A mão ou o pé fica frio, roxo ou dormente.',
          'Pode ter machucado o pescoço ou as costas: nesse caso não mexa na pessoa.',
        ],
      },
    ],
    refs: [
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 160, about: 'Primeiros socorros e talas improvisadas' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 161, about: 'Fratura exposta' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 121, about: 'Protocolo BT12: trauma de membros' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 123, about: 'Protocolo BT13: fratura exposta' },
    ],
    adaptation:
      'O protocolo do SAMU prevê que a equipe recoloque o membro na posição anatômica; para leigos, a ficha segue o manual, que proíbe tentar pôr o osso no lugar.',
    reviewed: false,
  },
  {
    slug: 'afogamento',
    title: 'Afogamento',
    summary: 'Não se arrisque na água. Fora dela, se não respira, comece as compressões.',
    keywords: ['afogamento', 'afogado', 'afogada', 'se afogando', 'piscina', 'rio', 'mar', 'enchente', 'engoliu água'],
    callFirst: 'Ligue 193 (Bombeiros) ou 192 (SAMU).',
    sections: [
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Só tire a pessoa da água se puder fazer isso sem se arriscar. Se não puder, chame os Bombeiros e não entre.',
          'Fora da água, se a pessoa não responde e não respira, comece as compressões no peito (ficha de parada cardíaca).',
          'Se ela respira, acalme-a e deite-a de lado.',
          'Tire a roupa molhada e aqueça com cobertor.',
          'Se ela mergulhou ou pode ter batido a cabeça, mexa no pescoço o mínimo possível.',
        ],
      },
      {
        kind: 'help',
        title: 'Procure atendimento se',
        items: [
          'A pessoa tosse muito, tem falta de ar ou espuma pela boca ou pelo nariz.',
          'Está confusa, sonolenta ou com os lábios roxos.',
        ],
      },
    ],
    refs: [
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 11, about: 'Retirar da água só com segurança para quem socorre' },
      { doc: 'ms-fiocruz-primeiros-socorros-2003', page: 53, about: 'Resgate: não se expor inutilmente' },
      { doc: 'ms-samu-suporte-basico-de-vida-2016', page: 135, about: 'Protocolo BT22: afogamento' },
    ],
    adaptation:
      'Adaptado para leigos a partir do protocolo do SAMU, que trata da pessoa já fora da água; a parte de não se arriscar no resgate vem do manual.',
    reviewed: false,
  },
  {
    slug: 'picada-de-animal-peconhento',
    title: 'Picada de cobra, escorpião ou aranha',
    summary: 'Procure atendimento já. Não amarre, não corte e não chupe o local.',
    keywords: ['picada', 'cobra', 'cobra picou', 'jararaca', 'cascavel', 'escorpião', 'aranha', 'animal peçonhento', 'peçonhento', 'veneno', 'ofídico', 'lagarta', 'taturana', 'abelha'],
    callFirst: 'Procure atendimento médico imediatamente. Se não houver como chegar rápido, ligue 192.',
    sections: [
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Fotografe o animal ou guarde o máximo de detalhes dele (tipo, cor, tamanho) para contar a quem atender.',
          'Se não atrasar a ida ao atendimento, lave o local com água e sabão.',
          'Deixe a pessoa em repouso, com o braço ou a perna picados levantados, até chegar ao pronto-socorro.',
          'Tire anéis, pulseiras, fitas amarradas e calçados apertados do membro picado.',
          'Picada de cobra: dê água potável para a pessoa beber.',
          'Escorpião ou aranha: compressa morna ajuda a aliviar a dor.',
          'Ferrão de abelha: retire raspando com uma lâmina, não com pinça.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não amarre o braço ou a perna (nada de torniquete ou garrote).',
          'Não corte, não queime e não esprema o local.',
          'Não tente chupar o veneno.',
          'Não passe nada no local: pó de café, álcool, terra, folhas, fezes ou qualquer outra coisa.',
          'Não faça curativo no local.',
          'Não dê bebida alcoólica, querosene, gasolina ou outros líquidos do tipo.',
          'Não tente pegar o animal, mesmo que pareça morto.',
        ],
      },
      {
        kind: 'help',
        title: 'Em enchente ou entulho',
        items: [
          'Cobras, escorpiões e aranhas se escondem em lugares secos, dentro de casa e no entulho. Se encontrar um, não toque e chame os Bombeiros (193) ou o serviço de zoonoses.',
        ],
      },
    ],
    refs: [
      { doc: 'ms-guia-animais-peconhentos-2024', page: 164, about: 'Primeiros socorros' },
      { doc: 'ms-guia-animais-peconhentos-2024', page: 165, about: 'O que não fazer; ferrão de abelha' },
      { doc: 'ms-orientacoes-enchentes', page: 2, about: 'Animais peçonhentos em enchentes' },
    ],
    reviewed: false,
  },
  {
    slug: 'diarreia-e-desidratacao',
    title: 'Diarreia e desidratação',
    summary: 'Ofereça líquido depois de cada evacuação e continue alimentando. Soro caseiro se faltar o envelope.',
    keywords: ['diarreia', 'desidratação', 'desidratado', 'soro caseiro', 'soro oral', 'vômito', 'vomitando', 'reidratação', 'disenteria', 'intestino solto'],
    sections: [
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Continue dando comida, em pequenas porções e mais vezes. Bebê: peito quantas vezes ele quiser.',
          'Depois de cada evacuação, ofereça mais líquido que o normal: água, chá ou suco sem açúcar, água de coco, sopa ou soro.',
          'Quantidade depois de cada evacuação: até 1 ano, 50 a 100 ml; de 1 a 10 anos, 100 a 200 ml; acima de 10 anos, o quanto aceitar.',
          'Soro de reidratação: misture um envelope (do posto de saúde ou da farmácia) em 1 litro de água fervida ou filtrada. Use em até 24 horas.',
          'Se vomitar, espere 10 minutos e ofereça de novo, devagar, às colheradas.',
        ],
      },
      {
        kind: 'do',
        title: 'Sem envelope: soro caseiro',
        items: [
          '1 copo de 200 ml de água fervida ou filtrada.',
          '1 pitada de sal (com 3 dedos) e 1 punhado pequeno de açúcar.',
          'Misture bem. É uma solução de emergência até conseguir o envelope.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não dê refrigerante, bebida com açúcar, bala ou doce, e não adoce chá nem suco.',
          'Não ponha açúcar nem sal no soro de envelope, e não ferva o soro depois de pronto.',
          'Não dê remédio para "cortar" a diarreia ou o vômito sem orientação de um profissional de saúde.',
        ],
      },
      {
        kind: 'help',
        title: 'Leve ao serviço de saúde se',
        items: [
          'Aparecerem sinais de desidratação: olhos fundos, muita sede, choro sem lágrimas, pouca saliva, pouco xixi, pele que demora a voltar quando beliscada.',
          'Houver vômitos repetidos, sangue nas fezes, recusa de comida ou a diarreia piorar.',
          'Não melhorar em 2 dias.',
        ],
      },
    ],
    refs: [
      { doc: 'ms-caderneta-crianca-2024', page: 22, about: 'Alimentação e líquidos durante a diarreia' },
      { doc: 'ms-caderneta-crianca-2024', page: 23, about: 'Sinais de desidratação e soro de envelope' },
      { doc: 'ms-caderneta-crianca-2024', page: 24, about: 'Soro caseiro' },
      { doc: 'ms-manejo-diarreia-cartaz', page: 1, about: 'Plano A: quantidades, sinais de perigo e medicamentos' },
    ],
    adaptation: 'O soro de reidratação não cura a diarreia: ele evita a desidratação, que é o que pode matar.',
    reviewed: false,
  },
  {
    slug: 'crianca-sinais-de-perigo',
    title: 'Criança doente: sinais de perigo',
    summary: 'Febre em bebê com menos de 2 meses e outros sinais que pedem atendimento já.',
    keywords: ['febre', 'febre em criança', 'febre em bebê', 'bebê doente', 'criança doente', 'temperatura', 'sinais de perigo', 'criança molinha', 'não mama', 'respiração rápida'],
    callFirst: 'Diante de qualquer sinal abaixo, leve a criança ao serviço de urgência. Se não houver como levar, ligue 192 (a ligação é gratuita).',
    sections: [
      {
        kind: 'help',
        title: 'Bebê com menos de 2 meses',
        items: [
          'Febre: temperatura igual ou maior que 37,5 °C.',
          'Temperatura baixa: 35,5 °C ou menos.',
          'Muito molinho, se mexendo menos que o normal.',
          'Muito sonolento, com dificuldade para acordar.',
          'Cansado, com dificuldade para respirar ou respiração muito rápida.',
          'Não consegue mamar.',
          'Convulsão (tremores ou ataque) ou perda da consciência.',
          'Pele com pouca elasticidade, manchas avermelhadas ou arroxeadas.',
          'Pus saindo do ouvido, urina escura ou fezes com sangue.',
        ],
      },
      {
        kind: 'help',
        title: 'Criança com mais de 2 meses',
        items: [
          'Dificuldade para respirar ou respiração rápida.',
          'Não consegue mamar nem tomar líquidos.',
          'Vomita tudo o que come e bebe.',
          'Muito sonolenta, com dificuldade para acordar.',
          'Convulsão (tremores ou ataque) ou perda da consciência.',
          'Manchas avermelhadas ou arroxeadas na pele.',
          'Pele com pouca elasticidade.',
        ],
      },
      {
        kind: 'do',
        title: 'Enquanto isso',
        items: [
          'Se a criança tiver convulsão, veja a ficha de convulsão.',
          'Se tiver diarreia ou vômito, ofereça líquido como na ficha de diarreia e desidratação.',
        ],
      },
    ],
    refs: [{ doc: 'ms-caderneta-crianca-2024', page: 25, about: 'Sinais de perigo' }],
    adaptation:
      'A Caderneta da Criança traz os sinais de perigo, mas não cuidados caseiros para febre; a ficha não inventa esses cuidados. O manual de 2003 sugere toalhas com gelo e banho de imersão na febre alta, orientação que não seguimos para crianças.',
    reviewed: false,
  },
  {
    slug: 'enchente',
    title: 'Enchente: cuidados com a saúde',
    summary: 'Não beba, não nade e não coma nada que tocou a água da enchente.',
    keywords: ['enchente', 'inundação', 'alagamento', 'cheia', 'água da enchente', 'lama', 'leptospirose', 'tétano', 'entulho', 'desabrigado'],
    callFirst: 'Defesa Civil 199 · Bombeiros 193 · SAMU 192.',
    sections: [
      {
        kind: 'do',
        title: 'Faça',
        items: [
          'Trate a água antes de beber (veja a ficha de água para beber).',
          'Se precisar entrar na água ou na lama, use botas e luvas.',
          'Cubra cortes e arranhões com curativo à prova d\'água.',
          'Para mexer em entulho, proteja mãos, braços, pés e pernas com luvas e botas.',
          'Guarde bem o lixo e o entulho para não atrair ratos.',
          'Comida em lata de metal fechada, sem amassado, ferrugem ou furo, é a mais segura.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não nade, não tome banho e não beba água da enchente.',
          'Não coma nada que tocou a água da enchente ou a lama, mesmo embalado (potes, garrafas, caixinhas, sacos). Na dúvida, jogue fora.',
          'Nunca prove a comida para saber se está boa.',
          'Não toque em cobras, escorpiões ou aranhas, mesmo que pareçam mortos.',
          'Cuidado com a eletricidade: áreas alagadas aumentam muito o risco de choque.',
        ],
      },
      {
        kind: 'help',
        title: 'Procure atendimento se',
        items: [
          'Tiver febre, com ou sem dor no corpo (principalmente nas costas ou na batata da perna), depois de contato com a água ou a lama. Conte que teve esse contato: pode ser leptospirose.',
          'Tiver 3 ou mais episódios de diarreia em 24 horas, vômitos, dor de cabeça, dor na barriga ou sangue nas fezes.',
          'Se machucar com objetos do entulho: pode ser preciso vacina ou soro contra o tétano.',
        ],
      },
      {
        kind: 'help',
        title: 'Cuide também da cabeça',
        items: ['Se puder, mantenha contato com família e amigos, fale sobre o que sente e busque apoio psicológico se precisar.'],
      },
    ],
    refs: [
      { doc: 'ms-orientacoes-enchentes', page: 1, about: 'Água, sintomas, leptospirose e tétano' },
      { doc: 'ms-orientacoes-enchentes', page: 2, about: 'Alimentos, animais peçonhentos, choque elétrico e contatos' },
    ],
    reviewed: false,
  },
  {
    slug: 'agua-para-beber',
    title: 'Água para beber: como tratar',
    summary: 'Filtre e ponha 2 gotas de água sanitária por litro, ou ferva por 5 minutos.',
    keywords: ['água potável', 'água para beber', 'tratar água', 'água sanitária', 'hipoclorito', 'ferver água', 'água contaminada', 'purificar água', 'filtrar água'],
    sections: [
      {
        kind: 'do',
        title: 'Jeito 1: filtrar e desinfetar',
        items: [
          'Filtre ou coe a água com filtro de casa, coador de papel ou pano limpo.',
          'Ponha 2 gotas de hipoclorito de sódio a 2,5% para cada 1 litro de água.',
          'Misture bem e espere 30 minutos antes de beber.',
          'Na falta do hipoclorito, serve água sanitária com 2,0% a 2,5% de cloro ativo, desde que não tenha mais nada: sem alvejante, perfume, essência ou desinfetante.',
        ],
      },
      {
        kind: 'do',
        title: 'Jeito 2: filtrar e ferver (sem hipoclorito)',
        items: [
          'Filtre ou coe a água.',
          'Ferva por 5 minutos, contando a partir de quando começar a ferver.',
          'Espere esfriar e sacuda a água antes de beber.',
        ],
      },
      {
        kind: 'dont',
        items: [
          'Não beba água da enchente nem água que possa estar contaminada sem tratar.',
          'Não use água sanitária com perfume, alvejante ou outros aditivos.',
        ],
      },
      {
        kind: 'help',
        title: 'Água da torneira estranha',
        items: ['Se a água da torneira estiver com cheiro ou cor diferente do normal, avise a Secretaria Municipal de Saúde.'],
      },
    ],
    refs: [{ doc: 'ms-orientacoes-enchentes', page: 1, about: 'Duas opções para tratar a água' }],
    reviewed: false,
  },
]
