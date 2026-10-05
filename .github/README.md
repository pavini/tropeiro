# Tropeiro

**Conhecimento que chega onde a estrada termina.**

Tropeiro é um servidor de conhecimento e educação offline, pensado para o Brasil: enciclopédia, mapas, cursos, referências de saúde e um assistente de IA local, tudo rodando numa máquina só, sem depender de internet depois de instalado.

> **Status:** em preparação. Por enquanto este repositório é idêntico ao upstream, mais a infraestrutura do fork. Ainda não há release próprio do Tropeiro. Para instalar hoje, use o [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad).

## Origem

Tropeiro é um fork do [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad), da Crosstalk Solutions, LLC, distribuído sob a [Apache License 2.0](../LICENSE). Todo o crédito pela base do projeto é deles. "Project NOMAD" e o logo do NOMAD são marcas da Crosstalk Solutions e não fazem parte deste fork; veja o [NOTICE](../NOTICE).

## O que muda em relação ao NOMAD

Já feito:

- **Catálogo em português:** Wikipedia em português no seletor (mantendo as opções em inglês) e categorias de conteúdo com acervo em português: saúde, educação, literatura, faça você mesmo, computação e Brasil. Onde não existe acervo em português, a categoria aparece marcada como "(inglês)".
- **Biblioteca Kiwix em português por padrão** no explorador de conteúdo.

Planejado:

1. **Interface em português do Brasil.** O upstream decidiu fazer a internacionalização internamente e não aceita PRs de terceiros nessa frente, então ela será feita aqui.
2. **IA em português:** modelo padrão bom em PT e RAG ajustado (stopwords, OCR) e medido com a suíte de avaliação do projeto.
3. **Referências nacionais:** bulário da ANVISA no lugar do openFDA, material de Defesa Civil e de primeiros socorros.

## Branches

| Branch | Papel |
|---|---|
| `tropeiro` | Linha principal do fork. Todo trabalho próprio parte daqui. |
| `dev`, `main` | Espelhos do upstream, atualizados por fast-forward. Nunca recebem commits deste fork. |

A sincronização é feita pelo workflow [`tropeiro-sync-upstream`](workflows/tropeiro-sync-upstream.yml), toda segunda-feira. Ele atualiza os espelhos e abre um PR de `dev` para `tropeiro`. Se houver conflito, abre uma issue no lugar do PR.

## Contribuindo

Correções de bug e melhorias neutras de idioma (suporte a ARM, instalador etc.) vão primeiro como PR para o upstream, seguindo o [CONTRIBUTING](../CONTRIBUTING.md) deles: issue antes, branch a partir de `dev`, Conventional Commits. Tradução, conteúdo em português e o que for específico do Brasil ficam aqui, de preferência em arquivos novos e serviços isolados, para manter o diff com o upstream pequeno.

Para trabalhar localmente:

```bash
git clone git@github.com:pavini/tropeiro.git
cd tropeiro
git remote add upstream https://github.com/Crosstalk-Solutions/project-nomad.git
git remote set-url --push upstream DISABLED
git checkout tropeiro
```

## Rodando localmente

Para desenvolver e testar a interface. Precisa de Docker (Docker Desktop no Mac) e Node.js 22 ou mais novo; no Mac, também das Xcode Command Line Tools (`xcode-select --install`).

```bash
./dev/setup.sh   # sobe MySQL e Redis, cria admin/.env, instala dependências e prepara o banco
./dev/start.sh   # app com hot reload + workers; abra http://localhost:8080
```

O conteúdo baixado fica em `~/nomad-storage` (mude com `NOMAD_STORAGE_PATH`). O app instala serviços como o Kiwix em containers via Docker; em Mac com Apple Silicon isso não é oficialmente suportado pelo upstream, então para um teste completo use Linux x86.

## Licença

Apache License 2.0, a mesma do upstream. Veja [LICENSE](../LICENSE) e [NOTICE](../NOTICE).
