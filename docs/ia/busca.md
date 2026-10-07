# Como a IA busca no conteúdo

Este documento explica o caminho de uma pergunta até a resposta da IA, e as regras para mudar esse caminho. Se você vai mexer em busca, prompts, documentos indexados ou modelo, leia até o fim.

A regra principal: **mudança na busca ou nas respostas da IA só entra com os números de antes e depois.** "Pareceu melhor no chat" não conta. O modelo varia de uma rodada para outra, e uma melhora numa pergunta costuma esconder uma piora em outra.

---

## O caminho de uma pergunta

O código fica em `admin/app/services/rag_pipeline_service.ts` (montagem do prompt) e `admin/app/services/rag_service.ts` (busca e indexação).

```
pergunta
  │
  ├─ 1. reescrita (só a partir da 2ª pergunta da conversa)
  │     "e para criança?" → "dose de paracetamol para criança"
  │
  ├─ 2. busca por semelhança no Qdrant ──────────────┐
  │                                                   │
  ├─ 3. atalhos por nome (não dependem da busca):     │
  │     • ficha de primeiros socorros                 │
  │     • monografia do Formulário Terapêutico        │
  │       Nacional e bula da FDA do remédio citado    │
  │                                                   ▼
  ├─ 4. trechos em ordem: ficha → remédio → busca
  │
  ├─ 5. instruções conforme o caso:
  │     ficha → emergência (+ dose, se citou remédio)
  │     só remédio → roteiro de remédio
  │     trecho de saúde em primeiro → emergência
  │
  └─ 6. corte por tamanho do modelo e da janela de contexto → IA
```

### 1. Reescrita

Na primeira pergunta, a busca usa o texto como veio. Da segunda em diante, uma chamada curta à IA reescreve a pergunta incluindo o assunto da conversa, para "e para criança?" não buscar no vazio.

### 2. Busca por semelhança

- **Modelo de busca:** `nomic-embed-text:v1.5` (`EMBEDDING_MODEL_NAME` em `admin/constants/ollama.ts`). Ele transforma pergunta e trechos em vetores; o Qdrant devolve os mais parecidos.
- **Quantos:** `RAG_DEFAULT_TOP_K` (5) trechos, a partir de 3 vezes isso de candidatos.
- **Cortes:** semelhança mínima `RAG_DEFAULT_SCORE_THRESHOLD` (0,3) no Qdrant, e depois o piso de relevância `RAG_MIN_FINAL_SCORE` (0,62) sobre a nota já reordenada. Se nada passa, nenhum trecho entra: é melhor a IA responder sem contexto do que com contexto errado.
- **Reordenação:** um reforço pequeno para trechos que contêm as palavras da pergunta e uma penalidade para muitos trechos do mesmo documento.

### 3. Atalhos por nome

Quando dá para achar pelo nome, nada é mais confiável. Esses atalhos não passam pela busca por semelhança:

| Atalho | Como acha | Onde |
|---|---|---|
| Ficha de primeiros socorros | Título e palavras-chave da ficha (`palavras-chave` no Markdown). Precisa de uma palavra-chave inteira ou do título, não de uma palavra solta. | `app/utils/fichas_search.ts` |
| Monografia do FTN | Nome do remédio, sem o sal ("dipirona" acha "dipirona sódica"), e apelidos ("AAS", "soro caseiro", "Novalgina") | `app/utils/ftn.ts`, `constants/remedios.ts` |
| Bula da FDA | Nome do Brasil traduzido para o das bulas americanas ("paracetamol" → "acetaminophen") | `app/utils/remedios.ts`, `constants/remedios.ts` |

### 4 e 5. Ordem e instruções

A ficha vem primeiro porque foi conferida com o manual oficial. As instruções de emergência e de remédio ficam em `admin/constants/tropeiro.ts` (`EMERGENCY_PROMPT`, `MEDICINE_PROMPT`, `MEDICINE_IN_EMERGENCY_PROMPT`). Toda resposta segue o princípio do projeto de prever o cenário sem socorro.

### 6. Corte por tamanho

Modelos pequenos recebem menos trechos (`RAG_CONTEXT_LIMITS`), e o planejador de contexto corta o que não cabe na janela do modelo. As fontes mostradas embaixo da resposta são só as dos trechos que chegaram à IA (`buildCitations` em `app/utils/rag_prompt.ts`).

---

## O que está na base da IA

| Origem | Pasta | Como entra |
|---|---|---|
| Documentos oficiais (`conteudo/fontes.yml`) | `storage/referencias` | PDF página a página, com o número da página, para a resposta citar "p. 12" e o link abrir o PDF nela |
| Conteúdo do Tropeiro (`conteudo/`) | `storage/conteudos` | Cada ficha, guia e referência em Markdown |
| Arquivos enviados por quem cuida do servidor | `storage/kb_uploads` | Como vieram |
| Wikipedia e livros (ZIM) | `storage/zim` | Quando quem cuida do servidor escolhe indexar |

Quem lê e indexa é o worker de filas. Se você mudar o código de leitura, reinicie o worker.

---

## Como medir

Há duas medições, e elas respondem perguntas diferentes.

### Respostas: `tests/eval/emergencia/`

Faz perguntas de verdade à IA e confere a resposta com regras: o que ela precisa dizer, o que não pode dizer, se tem o caminho "se não houver socorro" e se cita documento oficial. São três conjuntos: emergência (`perguntas.json`), rádio (`radio.json`) e remédios (`remedios.json`). Detalhes em [`admin/tests/eval/emergencia/README.md`](../../admin/tests/eval/emergencia/README.md).

- Usa o modelo de conversa: leva alguns minutos e **varia entre rodadas**. Se uma pergunta muda de resultado sem motivo, rode de novo antes de concluir.
- Mede o produto inteiro, mas não diz se o erro foi da busca ou do modelo.

### Busca: `node ace eval:retrieval`

Mede só a busca: para cada pergunta, se o documento certo aparece entre os primeiros trechos (recall@k). Não usa o modelo de conversa, roda em segundos e dá sempre o mesmo número para o mesmo código. Por isso é a medição para comparar mudanças de busca.

O conjunto herdado do NOMAD está em inglês, com documentos de exemplo (`admin/tests/eval/`). **O conjunto em português, sobre o conteúdo do Tropeiro, está sendo construído** (veja o plano abaixo). Até lá, mudanças de busca são medidas com o teste de respostas.

### O que vai no PR

- Os números de antes e depois, da medição que se aplica (ou das duas).
- Se uma pergunta piorou, explique por quê, ou não mande.
- Ao acrescentar uma pergunta ao conjunto de teste, diga de onde vem a resposta certa (documento e página).

---

## Como escrever conteúdo que a IA acha

Para fichas, guias e referências em `conteudo/` (veja também [`conteudo/CONTRIBUINDO.md`](../../conteudo/CONTRIBUINDO.md)):

- **Título com a palavra que a pessoa usaria:** "Picada de cobra, escorpião ou aranha", não "Acidentes com animais peçonhentos".
- **Palavras-chave com o jeito de falar das pessoas:** sinônimos, termos populares, formas no plural e no feminino ("afogado", "afogada", "se afogando").
- **Evite palavra-chave curta e comum** ("mar", "rio"): ela só conta como palavra inteira, mas ainda pode combinar com perguntas de outros assuntos.
- **Uma seção por assunto, com título claro:** a busca devolve trechos, e um trecho sem o assunto no texto é difícil de achar.

---

## Pontos fracos conhecidos

Estes são os problemas já identificados, na ordem em que estão sendo tratados:

1. **Não há medição de busca em português.** Sem ela, todo o resto é chute.
2. **Reforço por palavra quebrado para o português.** A lista de palavras vazias é a do inglês, e a limpeza das palavras apaga letras acentuadas ("água" vira "gua").
3. **Trechos sem contexto.** Uma página de documento entra sem o nome do documento e da seção no texto.
4. **Todos os assuntos na mesma base.** Pergunta de rádio concorre com as 1.136 páginas do Formulário Terapêutico Nacional.
5. **Modelo de busca treinado principalmente em inglês.** Pergunta em português acha trechos piores do que deveria.
6. **Sem reordenação por modelo.** A reordenação atual é uma regra simples por palavras.
7. **Atalhos por nome só para fichas e remédios.**

## Plano

| Etapa | O que muda | Estado |
|---|---|---|
| 1 | Conjunto de perguntas em português, sobre o conteúdo real, com a página certa de cada uma, medido por `eval:retrieval` | a fazer |
| 2 | Busca híbrida: semelhança + palavra exata, em português | a fazer |
| 3 | Cabeçalho "documento · seção" em cada trecho | a fazer |
| 4 | Busca por tema (rádio busca em rádio) | a fazer |
| 5 | Modelo de busca multilíngue, escolhido pela medição (`bge-m3`, `qwen3-embedding`) | a fazer |
| 6 | Reordenação por modelo, se o ganho compensar o tempo em CPU | a fazer |
| 7 | Atalhos por nome genéricos (animais, plantas, canais de rádio) | a fazer |

Cada etapa atualiza este documento quando entra.
