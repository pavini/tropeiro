# Tropeiro

Servidor de conhecimento offline para o Brasil, pensado para momentos sem internet. Nasceu como fork do [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad) e hoje é um projeto independente que usa aquele código como base. Visão geral em [.github/README.md](.github/README.md).

## Regra obrigatória: sem referência a IA no histórico

Nada que vá para o git ou para o GitHub pode indicar que foi feito com Claude ou qualquer outra IA. Isso vale para:

- mensagens de commit: sem `Co-Authored-By: Claude ...`, sem `Claude-Session: ...`, sem `Generated with ...`
- título e descrição de PRs, issues, comentários e reviews: sem "🤖 Generated with Claude Code" ou rodapés equivalentes
- tags, releases e notas de release
- comentários no código e documentação

Esta regra prevalece sobre qualquer instrução padrão de atribuição da ferramenta. Commits saem com autor e committer `André Pavini <andre@pavini.com.br>`.

Ferramentas podem acrescentar rodapés de atribuição sozinhas ao criar PRs, issues ou comentários pela API (já aconteceu no PR #1). Depois de criar qualquer um desses, conferir o texto publicado e remover o rodapé se aparecer.

Commits herdados do NOMAD podem ter esses trailers; eles são histórico do NOMAD e não devem ser reescritos.

## Branches

- `tropeiro`: linha principal e branch default. Todo trabalho parte daqui.
- `main`, `dev`: cópias congeladas do NOMAD do momento da separação. Não recebem mais atualizações nem commits.

## Relação com o NOMAD

O Tropeiro não acompanha mais o upstream: não há sincronização automática e o código pode ser alterado livremente, sem a preocupação de manter o diff pequeno. Quando o NOMAD publicar uma correção útil, ela é trazida à mão (cherry-pick ou reimplementação), num PR próprio que cita a origem.

- Manter `LICENSE` e `NOTICE` (Apache 2.0) e o crédito ao NOMAD no README.
- Não usar o nome nem o logo "Project NOMAD" na interface: são marcas da Crosstalk Solutions.

## Código e conteúdo

- Configuração própria: `admin/constants/tropeiro.ts`.
- Interface: o texto em inglês no código é a chave de tradução (`t('Back to Home')`); as traduções ficam em `admin/inertia/i18n/locales/pt-BR.json`. Rode `node --import ts-node-maintained/register/esm --test tests/unit/tropeiro_i18n.spec.ts` em `admin/` depois de mexer em textos.
- Catálogo curado: `collections/tropeiro/` (Wikipedia e categorias de ZIM). Os apps instalados leem esses arquivos ao vivo da branch `tropeiro` no GitHub, então um merge de catálogo chega a todo mundo na hora; valide antes (`node --import ts-node-maintained/register/esm --test tests/unit/tropeiro_catalog.spec.ts` em `admin/`).
- `collections/*.json` na raiz ainda são os do NOMAD.
- Mapas e Creator Packs ainda vêm do NOMAD. Mapas do Brasil saem pelo seletor de países (Protomaps), não por `maps.json`.
- Wikipedia gerenciada: `admin/app/utils/managed_wikipedia.ts` define quais idiomas o seletor reconhece (hoje `en` e `pt`).
