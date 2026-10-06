# Como contribuir com conteúdo

O Tropeiro existe para ajudar pessoas quando não há internet, e às vezes nem socorro. Cada ficha, guia ou tabela daqui pode ser lida por alguém numa emergência. Por isso o conteúdo segue algumas regras firmes. Elas estão neste guia.

Não precisa saber programar. Todo conteúdo é um arquivo de texto em [Markdown](https://www.markdownguide.org/basic-syntax/), o mesmo formato do GitHub.

## Onde fica cada coisa

```
conteudo/
  temas.yml            os temas (saude, radio...) e a ordem em que aparecem
  fontes.yml           os documentos oficiais que o conteúdo cita
  saude/queimadura.md  um conteúdo: conteudo/<tema>/<nome>.md
  radio/...
  modelos/             modelos para copiar (não aparecem no Tropeiro)
```

O nome do arquivo vira o endereço da página: use só letras minúsculas sem acento, números e hífens (`radios-sem-licenca.md`).

## Os três tipos de conteúdo

| Tipo | Para quê | Exemplo |
|---|---|---|
| `ficha` | Passo a passo para uma emergência, para ler com pressa | Queimadura, engasgo |
| `guia` | Explica um assunto, do básico ao que dá para fazer sozinho | Como o rádio funciona |
| `referencia` | Tabela ou lista para consulta rápida | Canais de rádio, alfabeto fonético |

Comece copiando o modelo do tipo certo em `modelos/`.

## As regras

1. **Escreva para quem nunca viu o assunto.** Frases curtas, palavras do dia a dia. Explique a sigla na primeira vez que ela aparecer.
2. **Pense em quem está sem socorro.** O Tropeiro é usado quando celular, internet e às vezes até o SAMU não funcionam. Diga o que fazer se der para pedir ajuda e também o que fazer se não der. Quando algo só se resolve com atendimento, diga isso com franqueza.
3. **Toda informação técnica, legal ou de saúde precisa de fonte oficial.** Frequência, dose, potência, regra, tempo, medida: cada uma com o documento e a página (ou o trecho) de onde saiu. Nada de memória, blog ou "todo mundo sabe".
4. **Escreva com suas palavras.** Não copie parágrafos do documento: explique e cite. Tabelas de valores (canais, frequências) podem ser transcritas.
5. **Quando as fontes discordarem ou a regra tiver mudado, diga.** Exemplo: o canal 9 do PX é emergência por costume de uma norma revogada, não por regra atual. Use o campo `adaptacao` para explicar como você resolveu.
6. **Nada de marca ou produto.** Fale do tipo de equipamento, não de fabricante.

## O cabeçalho

Todo arquivo começa com um cabeçalho entre `---`:

```yaml
---
titulo: Rádios que qualquer pessoa pode usar
tema: radio                 # a pasta onde o arquivo está
tipo: guia                  # ficha, guia ou referencia
resumo: Uma ou duas frases sobre o que a pessoa vai encontrar.
palavras-chave: [walkie-talkie, rádio sem licença, PX]   # o que alguém digitaria na busca
veja-tambem: [radio/como-o-radio-funciona]               # opcional
ligue-antes: Ligue 192 agora.                            # só fichas, opcional
adaptacao: Como o texto foi adaptado da fonte.           # opcional
revisao:
  revisado: false           # true só depois da revisão de um especialista
  por: ""                   # quem revisou (nome e área)
autores: [Seu Nome]
atualizado: 2026-10-06      # AAAA-MM-DD
---
```

## Citando as fontes

O jeito preferido é a **nota de fonte**, logo depois da frase que ela sustenta:

```markdown
A potência máxima é de 0,5 W.[^potencia]

[^potencia]: anatel-ato-14448-2017, trecho "15.1.3. A potência efetivamente radiada" — potência máxima
```

O formato da nota é sempre `id-do-documento, p. 12 — sobre o quê` (para PDF) ou `id-do-documento, trecho "texto exato" — sobre o quê` (para norma guardada como página). O trecho tem que ser copiado exatamente como está no documento: é ele que faz o link abrir no lugar certo.

No Tropeiro, a nota vira um número pequeno que abre o documento na página ou no trecho citado.

Também dá para listar as fontes no cabeçalho, quando elas valem para o conteúdo todo:

```yaml
fontes:
  - { doc: ms-cartilha-queimaduras-2012, pagina: 6, sobre: tratamento imediato }
```

### Documento novo

Se a fonte ainda não está em `fontes.yml`, acrescente:

```yaml
- id: anatel-cartilha-radioamador-2026      # nome curto, usado nas notas
  titulo: Cartilha do Serviço Radioamador (versão 2026-06)
  publicador: Anatel
  ano: 2026
  tema: radio
  publico: populacao                       # ou profissional (protocolo para socorrista, médico...)
  formato: pdf                             # pdf ou html
  url: https://...                         # endereço oficial de onde o servidor baixa
  sha256: ...                              # PDF: shasum -a 256 arquivo.pdf
  tamanho: 1517183                         # PDF: tamanho em bytes
  licenca: O que o documento diz sobre reprodução, ou a falta disso.
```

Para norma que só existe como página (portal de legislação, Planalto), use `formato: html` e, no lugar de `sha256` e `tamanho`, uma lista `trechos` com frases que a página tem que conter. O servidor confere essas frases antes de guardar a cópia.

## Fichas

Ficha tem seções com títulos fixos, porque a tela de ficha é feita para emergência:

```markdown
## Faça

1. Primeiro passo.
2. Segundo passo.

## Faça — Se não parar de sangrar

1. ...

## Não faça

- Não use gelo.

## Procure ajuda — Ligue 192 se

- A queimadura pega uma área grande.
```

`## Faça`, `## Não faça` e `## Procure ajuda` são obrigatórios no começo do título; depois de ` — ` vem o nome da seção, se quiser.

## Textos de destaque e tabelas

```markdown
> [!ATENCAO]
> Mensagem de emergência tem prioridade em qualquer canal.

| Canal | Frequência (MHz) |
|-------|------------------|
| 1     | 462,5625         |
```

## Antes de abrir o pull request

Rode o validador (precisa do Node instalado):

```bash
cd admin
npm install
npm run conteudo:validar
```

Ele aponta cada problema com o arquivo e a linha, em português. O mesmo teste roda sozinho no GitHub em todo pull request que mexe em `conteudo/`.

## Revisão

Todo conteúdo entra marcado como **não revisado**, e o Tropeiro mostra isso na tela. Ele só passa a revisado quando um especialista da área confere o texto contra as fontes e assina em `revisao.por`:

- saúde: profissional de saúde (medicina, enfermagem, socorrista);
- rádio: radioamador licenciado;
- outros temas: quem tem formação ou experiência comprovada no assunto.

Se você é especialista e quer revisar, abra um pull request mudando `revisado: true` e `por: "Seu nome, sua área"`.
