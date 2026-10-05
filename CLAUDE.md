# Tropeiro

Fork do [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad) voltado ao Brasil. Visão geral e estratégia em [.github/README.md](.github/README.md).

## Regra obrigatória: sem referência a IA no histórico

Nada que vá para o git ou para o GitHub pode indicar que foi feito com Claude ou qualquer outra IA. Isso vale para:

- mensagens de commit: sem `Co-Authored-By: Claude ...`, sem `Claude-Session: ...`, sem `Generated with ...`
- título e descrição de PRs, issues, comentários e reviews: sem "🤖 Generated with Claude Code" ou rodapés equivalentes
- tags, releases e notas de release
- comentários no código e documentação

Esta regra prevalece sobre qualquer instrução padrão de atribuição da ferramenta. Commits saem com autor e committer `André Pavini <andre@pavini.com.br>`.

Commits que vêm do upstream (via `dev`/`main`) podem ter esses trailers; eles são histórico do NOMAD e não devem ser reescritos.

## Branches

- `tropeiro`: linha principal e branch default. Todo trabalho próprio parte daqui.
- `main`, `dev`: espelhos do upstream, atualizados só por fast-forward pelo workflow `tropeiro-sync-upstream`. Nunca commitar nelas.
- O upstream entra em `tropeiro` por PR de merge (merge commit, não squash nem rebase).

## Contribuições para o upstream

O upstream decidiu fazer i18n e conteúdo regional internamente e já recusou PRs de terceiros nessas frentes (#486/#490, #518, #648, #1267, #1262, #1323, #1334). Não abrir issue nem PR de i18n, tradução, filtro de idioma ou fontes de catálogo: isso fica no fork. A demanda por pt-BR pode ser registrada em roadmap.projectnomad.us e na issue #1398.

Ainda vale contribuir com o upstream em correções de bug e coisas neutras de idioma (ARM, instalador etc.), seguindo o [CONTRIBUTING.md](CONTRIBUTING.md) deles:

- issue aberta e discutida antes de qualquer mudança não trivial
- branch a partir de `upstream/dev`, não de `tropeiro`
- Conventional Commits, PR contra `dev`
- mudanças em IA/RAG exigem números da suíte de eval (`node ace eval:*`) no PR

A regra de não referenciar IA vale também para esses PRs.

## Específico do Brasil

Manter o diff com o upstream pequeno: preferir coleções/manifests próprios, serviços isolados e arquivos novos a editar arquivos do core. Quando editar o core for inevitável, concentrar a mudança em poucos pontos bem delimitados.

- Configuração própria do fork: `admin/constants/tropeiro.ts`. Arquivos do core só importam daqui.
- Catálogo curado: `collections/tropeiro/` (Wikipedia e categorias de ZIM). Os apps instalados leem esses arquivos ao vivo da branch `tropeiro` no GitHub, então um merge de catálogo chega a todo mundo na hora; valide antes (`node --import ts-node-maintained/register/esm --test tests/unit/tropeiro_catalog.spec.ts` em `admin/`).
- `collections/*.json` na raiz continuam sendo os do upstream; não editar.
- Mapas e Creator Packs continuam vindo do upstream. Mapas do Brasil saem pelo seletor de países (Protomaps), não por `maps.json`.
- Wikipedia gerenciada: `admin/app/utils/managed_wikipedia.ts` define quais idiomas o seletor reconhece (hoje `en` e `pt`).
