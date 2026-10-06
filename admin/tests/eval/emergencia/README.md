# Teste das respostas de emergência

Mede se a IA responde certo, para uma pessoa leiga, a perguntas de primeiros
socorros e emergência. Roda contra o servidor de verdade, pelo mesmo caminho da
tela Perguntar (`/api/ollama/chat`, com a base de conhecimento), e corrige cada
resposta por regras fixas, sem outra IA como juiz.

Use sempre que mexer no prompt, na busca da base de conhecimento ou trocar de
modelo, e compare com a rodada anterior.

## Como rodar

Com o servidor de desenvolvimento no ar e a IA instalada, em `admin/`:

```bash
node --import ts-node-maintained/register/esm tests/eval/emergencia/run.ts --model=llama3.1:8b --rotulo=depois
# só algumas perguntas:
node --import ts-node-maintained/register/esm tests/eval/emergencia/run.ts --model=llama3.1:8b --rotulo=teste --so=cobra,engasgo
```

Há também perguntas sobre comunicação por rádio (`radio.json`), para os guias:

```bash
node --import ts-node-maintained/register/esm tests/eval/emergencia/run.ts --model=llama3.1:8b --rotulo=radio --perguntas=radio
```

E sobre remédios (`remedios.json`), com doses e interações tiradas do
Formulário Terapêutico Nacional (precisa do FTN baixado em `storage/referencias`):

```bash
node --import ts-node-maintained/register/esm tests/eval/emergencia/run.ts --model=llama3.1:8b --rotulo=remedios --perguntas=remedios
```

O relatório (respostas completas e cada verificação) vai para
`tests/eval/reports/emergencia-<rotulo>-<data>.json`, gravado a cada pergunta.

Depois de ajustar o corretor, dá para corrigir de novo uma rodada antiga sem
perguntar tudo à IA:

```bash
node --import ts-node-maintained/register/esm tests/eval/emergencia/recorrigir.ts tests/eval/reports/emergencia-....json
```

Com o Ollama no Docker de um Mac (só processador), uma rodada leva perto de uma
hora; com Ollama usando a GPU, uns 8 minutos.

## O que é verificado

`perguntas.json` tem 15 perguntas. As regras saem das fichas de primeiros
socorros (`app/content/fichas.ts`), que já foram conferidas com os manuais
oficiais. Para cada pergunta:

- **diz**: o que a resposta precisa conter (ex.: resfriar a queimadura com água);
- **não diz**: o que ela não pode recomendar (ex.: gelo, torniquete na picada de
  cobra). Só conta como erro quando não vem logo depois de uma negação, na
  mesma frase ("não use gelo" está certo);
- **caminho sem socorro**: o que fazer se não houver SAMU, bombeiros nem
  hospital;
- **cita documento oficial**: a resposta se apoia num documento guardado no
  servidor.

As respostas variam de uma rodada para outra: compare totais, não uma pergunta
isolada. As regras são expressões regulares sobre o texto sem acento; quando
uma resposta certa for marcada como errada (ou o contrário), ajuste a regra em
`perguntas.json` ou a lista de negações em `score.ts`, com teste em
`tests/unit/emergencia_score.spec.ts`.
