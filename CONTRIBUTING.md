# Como contribuir com o Tropeiro

Obrigado pelo interesse. O Tropeiro é um servidor de conhecimento offline para o Brasil, feito para quando não há internet nem socorro. Ele é mantido por voluntários, e este guia existe para que qualquer pessoa consiga contribuir do mesmo jeito que quem começou o projeto.

Leia até o fim antes do primeiro PR. Os guias específicos ficam ao lado do que descrevem:

| Vai mexer em | Leia também |
|---|---|
| Fichas, guias e referências (`conteudo/`) | [`conteudo/CONTRIBUINDO.md`](conteudo/CONTRIBUINDO.md) |
| Como a IA busca e responde | [`docs/ia/busca.md`](docs/ia/busca.md) |
| Testes de resposta da IA | [`admin/tests/eval/emergencia/README.md`](admin/tests/eval/emergencia/README.md) |
| Catálogo de Wikipedia e ZIMs (`collections/tropeiro/`) | a seção [Catálogo](#catálogo) abaixo |

---

## Princípios

Toda decisão do projeto passa por estes pontos. Um PR que contraria algum deles precisa explicar por quê.

1. **Funciona sem internet.** O que a pessoa precisa numa crise está no servidor. Documento oficial citado fica baixado e abre na página certa, sem conexão.
2. **Prevê o cenário sem socorro.** Fichas e respostas dizem o que fazer quando não há SAMU, bombeiros, farmácia nem hospital: o que observar, até quando dá para seguir por conta própria e quando é preciso levar a pessoa de qualquer jeito.
3. **Tudo em português do Brasil.** Interface, respostas da IA e mensagens do servidor.
4. **Fonte oficial e honestidade.** Conteúdo de saúde, rádio ou segurança cita o documento oficial em que se baseia. Conteúdo não revisado por especialista aparece como "não revisado".
5. **Para quem nunca usou.** Frases curtas, botões grandes, nada de jargão. Se uma pessoa nervosa não entende em segundos, não está pronto.
6. **Medido, não achado.** Mudança na IA (busca, prompts, modelo) vem com os números de antes e depois.

---

## Antes de começar

- **Mudança grande: abra uma issue primeiro**, para combinar o caminho antes de escrever código.
- **Correção pequena** (texto, tradução, erro óbvio de uma linha): pode mandar o PR direto.
- **Conteúdo** (uma ficha nova, uma correção de dose): siga [`conteudo/CONTRIBUINDO.md`](conteudo/CONTRIBUINDO.md). Não precisa saber programar.

---

## Ambiente de desenvolvimento

Funciona em macOS e Linux. Você precisa de Docker (Docker Desktop no Mac), Node.js 22 ou mais novo e uns 20 GB livres; no Mac, também das Xcode Command Line Tools (`xcode-select --install`).

```bash
git clone https://github.com/pavini/tropeiro.git
cd tropeiro
./dev/setup.sh     # uma vez: MySQL e Redis, .env, dependências e banco
./dev/start.sh     # sobe o servidor com recarga automática e o worker de filas
```

Depois, abra http://localhost:8080. Os apps que o Tropeiro instala (Kiwix e outros) rodam em contêineres Docker; em Mac com Apple Silicon isso não é suportado oficialmente, então para um teste completo use Linux x86.

- **IA:** instale o [Ollama](https://ollama.com) na sua máquina e escolha o endereço dele em `/ia` (`http://localhost:11434`). Para começar, `ollama pull llama3.1:8b` e `ollama pull nomic-embed-text:v1.5`.
- **Conteúdo em desenvolvimento:** vale a pasta `conteudo/` do repositório, que você está editando. A atualização pela internet fica desligada (`TROPEIRO_CONTEUDO_ATUALIZAR=0` no `admin/.env`).
- **Worker:** o `dev/start.sh` religa o worker de filas se ele cair. Se você mudar código que roda no worker (download, leitura de documentos para a IA), reinicie o `start.sh`.

---

## Branches e fluxo

- **`tropeiro`** é a branch principal. Todo trabalho parte dela, e todo PR volta para ela.
- `main` e `dev` são cópias congeladas do NOMAD, do momento da separação. Não recebem commits.
- **PRs pequenos**, um assunto por PR. Um PR que mistura duas mudanças volta para ser dividido.
- Mantenha sua branch em dia com `git rebase origin/tropeiro`, sem merge de volta.

### Commits e PRs

- Mensagem no formato `tipo: descrição em português` (`feat: remédios na interface nova`, `fix: bulas baixam fora do Docker`). Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- O corpo do commit explica o porquê, não repete o diff.
- **Sem rodapés de ferramentas** em commits, PRs, issues e comentários: nada de `Co-Authored-By` de ferramenta, `Generated with` e afins. Algumas ferramentas acrescentam isso sozinhas; confira o texto publicado e remova.
- A descrição do PR diz o que muda, como testar e, se mexeu na IA, os números de antes e depois.

---

## Interface

- A interface principal é a nova: telas em `admin/inertia/pages/novo/`, estilo em `admin/inertia/novo/novo.css` (classes `nv-*`). A interface clássica (`/home`, `/settings`...) está sendo migrada e não recebe telas novas.
- **Textos:** escreva em inglês no código, como chave de tradução (`t('Back to Home')`), e ponha a tradução em `admin/inertia/i18n/locales/pt-BR.json`. Depois rode, em `admin/`:
  ```bash
  node --import ts-node-maintained/register/esm --test tests/unit/tropeiro_i18n.spec.ts
  ```
- **Teste no navegador**, em tela de computador e de celular (largura de 390 px). Erros de layout não aparecem no typecheck.
- Animação sempre respeita `prefers-reduced-motion`.

---

## Testes e verificações

Em `admin/`, antes de abrir o PR:

```bash
npx tsc --noEmit -p tsconfig.json                 # backend: zero erros
npx tsc --noEmit -p inertia/tsconfig.json         # frontend: não pode aumentar os erros que já existem
node --import ts-node-maintained/register/esm --test tests/unit/<arquivo>.spec.ts
npm run conteudo:validar                          # se mexeu em conteudo/
```

Os testes em `tests/unit/` que não dependem do Adonis rodam assim, direto com o Node. Lógica nova vai para uma função pura em `app/utils/` com o teste ao lado, e o serviço só chama a função.

### Se mexeu na IA

Busca, prompts, fichas que entram na resposta, documentos indexados ou modelo: meça. As regras e os comandos estão em [`docs/ia/busca.md`](docs/ia/busca.md). Em resumo:

- a medição da busca roda em segundos e não usa o modelo de conversa;
- o teste de respostas (`tests/eval/emergencia/`) roda as perguntas de emergência, rádio e remédios no modelo de verdade;
- os números de antes e depois vão na descrição do PR. O modelo varia de uma rodada para outra: na dúvida, rode duas vezes.

---

## Catálogo

`collections/tropeiro/` define a Wikipedia e as categorias de ZIM oferecidas nos kits. Os servidores instalados leem esses arquivos ao vivo da branch `tropeiro` no GitHub, então **um merge de catálogo chega a todo mundo na hora**. Valide antes:

```bash
node --import ts-node-maintained/register/esm --test tests/unit/tropeiro_catalog.spec.ts
```

---

## Licença e origem

O Tropeiro começou como fork do [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad) e hoje é independente.

- O código é Apache 2.0. Mantenha `LICENSE` e `NOTICE` e o crédito ao NOMAD no README.
- "Project NOMAD" e o logo são marcas da Crosstalk Solutions: não use na interface.
- Correção útil do NOMAD entra à mão, num PR próprio que cita a origem.
- Ao contribuir, você concorda em licenciar sua contribuição sob a Apache 2.0.

---

## Conduta

Seja respeitoso. Veja o [código de conduta](CODE_OF_CONDUCT.md).
