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

O que serve para qualquer usuário do NOMAD (i18n, ARM, correções) vai como PR para `Crosstalk-Solutions/project-nomad`, seguindo o [CONTRIBUTING.md](CONTRIBUTING.md) deles:

- issue aberta e discutida antes de qualquer mudança não trivial
- branch a partir de `upstream/dev`, não de `tropeiro`
- Conventional Commits, PR contra `dev`
- mudanças em IA/RAG exigem números da suíte de eval (`node ace eval:*`) no PR

A regra de não referenciar IA vale também para esses PRs.

## Específico do Brasil

Manter o diff com o upstream pequeno: preferir coleções/manifests próprios, serviços isolados e arquivos novos a editar arquivos do core. Quando editar o core for inevitável, concentrar a mudança em poucos pontos bem delimitados.
