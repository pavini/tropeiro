/**
 * Configuração própria do Tropeiro.
 *
 * Tudo que diferencia o fork do upstream em tempo de execução fica concentrado
 * aqui, para que os pontos de contato com o código do NOMAD sejam só imports.
 */

/**
 * Catálogo curado do Tropeiro (Wikipedia e categorias de ZIM), servido direto
 * da branch `tropeiro`. Mapas e Creator Packs continuam vindo do upstream.
 */
export const TROPEIRO_CATALOG_BASE_URL =
  'https://raw.githubusercontent.com/pavini/tropeiro/refs/heads/tropeiro/collections/tropeiro'

export const TROPEIRO_WIKIPEDIA_URL = `${TROPEIRO_CATALOG_BASE_URL}/wikipedia.json`
export const TROPEIRO_ZIM_CATEGORIES_URL = `${TROPEIRO_CATALOG_BASE_URL}/kiwix-categories.json`

/**
 * Idioma padrão (ISO-639-3) do explorador da biblioteca Kiwix. O usuário pode
 * trocar na tela; isto só define o que aparece na primeira abertura.
 */
export const DEFAULT_CONTENT_LANGUAGE = 'por'

/**
 * Idioma da interface (BCP 47). Os textos do front continuam em inglês no
 * código e servem de chave; a tradução sai de `inertia/i18n/locales/`.
 */
export const DEFAULT_UI_LANGUAGE = 'pt-BR'

/**
 * Idioma das respostas da IA. Entra como prompt de sistema em toda conversa:
 * sem isso, modelos pequenos respondem em espanhol a perguntas curtas como
 * "esta funcionando?", que valem nas duas línguas.
 */
export const AI_LANGUAGE_PROMPT = `Responda sempre em português do Brasil, mesmo quando a pergunta for curta, ambígua ou parecer escrita em outra língua próxima, como o espanhol. Só use outro idioma se a pessoa pedir explicitamente.
Quando o assunto for emergência, use as referências do Brasil: SAMU 192, Bombeiros 193, Polícia Militar 190 e Defesa Civil 199.`

/**
 * Instruções para perguntas de emergência e saúde. Entram só quando a pergunta
 * combina com uma ficha ou a busca trouxe um documento oficial, para não
 * mudar respostas de outros assuntos. Pensadas para uma pessoa comum, sem
 * equipamento, que pode estar num lugar onde não há socorro.
 */
export const EMERGENCY_PROMPT = `Esta pergunta é sobre emergência ou saúde. Responda para uma pessoa comum, sem treinamento e sem equipamento, que pode estar num lugar onde não há socorro: sem SAMU, sem bombeiros, sem hospital.

Organize a resposta nestas partes, com estes títulos:
## Faça agora
Passos curtos, na ordem em que devem ser feitos.
## Se der para pedir ajuda
SAMU 192, Bombeiros 193, Polícia 190 ou Defesa Civil 199, ou levar a pessoa a um posto de saúde ou hospital. Diga quando isso é urgente.
## Se não houver socorro
O que fazer por conta própria nas horas e dias seguintes, os sinais de que a pessoa está piorando e como transportá-la com segurança. Se a situação só se resolve com atendimento (por exemplo, soro contra veneno de cobra), diga isso com franqueza e diga o que aumenta as chances até conseguir atendimento.
## Não faça
Os erros comuns que pioram a situação.

Regras:
- Se houver uma ficha de primeiros socorros do Tropeiro no contexto, siga a ficha: ela foi conferida com os manuais oficiais. Repita os "não faça" dela.
- Prefira os documentos escritos para a população. Dos protocolos para profissionais de saúde, use só o que uma pessoa comum consegue fazer: nada de oxigênio, remédio, soro na veia ou aparelho.
- Não invente procedimento, dose, receita ou medida que não esteja no contexto. Na dúvida, deixe de fora.
- Nunca recomende algo que o contexto manda não fazer.
- Use frases curtas e palavras simples.`

/**
 * Conteúdo do Tropeiro (pasta conteudo/ do repositório), baixado pelos
 * servidores quando há internet, para correções chegarem sem esperar versão.
 */
export const TROPEIRO_CONTENT_REPO = { owner: 'pavini', repo: 'tropeiro', branch: 'tropeiro', path: 'conteudo' }

/** Versão do formato de conteudo/ que esta versão do Tropeiro sabe ler (conteudo/formato.yml). */
export const CONTENT_FORMAT_VERSION = 1

/** Nome do produto na interface (título da aba, rodapé, cabeçalho). */
export const APP_NAME = 'Tropeiro'
