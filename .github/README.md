# Tropeiro

**Conhecimento que chega onde a estrada termina.**

Tropeiro é um servidor de conhecimento e educação offline, pensado para o Brasil: enciclopédia, mapas, cursos, referências de saúde e um assistente de IA local, tudo rodando numa máquina só, sem depender de internet depois de instalado.

> **Status:** em preparação. Ainda não há release próprio do Tropeiro.

## Origem

Tropeiro nasceu como fork do [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad), da Crosstalk Solutions, LLC, distribuído sob a [Apache License 2.0](../LICENSE), e usa o código dele como base. Todo o crédito por essa base é deles. Desde então o Tropeiro segue como projeto independente: não acompanha mais o NOMAD e tem rumo e interface próprios. "Project NOMAD" e o logo do NOMAD são marcas da Crosstalk Solutions e não fazem parte deste fork; veja o [NOTICE](../NOTICE).

## O que já é diferente

Já feito:

- **Catálogo em português:** Wikipedia em português no seletor (mantendo as opções em inglês) e categorias de conteúdo com acervo em português: saúde, educação, literatura, faça você mesmo, computação e Brasil. Onde não existe acervo em português, a categoria aparece marcada como "(inglês)".
- **Biblioteca Kiwix em português por padrão** no explorador de conteúdo.

Planejado:

1. **Interface em português do Brasil.**
2. **IA em português:** modelo padrão bom em PT e RAG ajustado (stopwords, OCR) e medido com a suíte de avaliação do projeto.
3. **Referências nacionais:** bulário da ANVISA no lugar do openFDA, material de Defesa Civil e de primeiros socorros.

## Branches

| Branch | Papel |
|---|---|
| `tropeiro` | Linha principal. Todo trabalho parte daqui. |
| `dev`, `main` | Cópias congeladas do NOMAD do momento da separação. Não recebem mais atualizações. |

## Contribuindo

Veja o [guia de contribuição](../CONTRIBUTING.md): ambiente, regras, testes e como abrir um PR. Para fichas, guias e referências, sem precisar programar, veja [conteudo/CONTRIBUINDO.md](../conteudo/CONTRIBUINDO.md).

```bash
git clone git@github.com:pavini/tropeiro.git
cd tropeiro
git checkout tropeiro
```

## Rodando localmente

Para desenvolver e testar a interface. Precisa de Docker (Docker Desktop no Mac) e Node.js 22 ou mais novo; no Mac, também das Xcode Command Line Tools (`xcode-select --install`).

```bash
./dev/setup.sh   # sobe MySQL e Redis, cria admin/.env, instala dependências e prepara o banco
./dev/start.sh   # app com hot reload + workers; abra http://localhost:8080
```

O conteúdo baixado fica em `admin/storage`, a mesma pasta que os containers do Kiwix e dos outros apps montam. O app instala serviços como o Kiwix em containers via Docker; em Mac com Apple Silicon isso não é oficialmente suportado, então para um teste completo use Linux x86.

## Licença

Apache License 2.0, a mesma do Project NOMAD. Veja [LICENSE](../LICENSE) e [NOTICE](../NOTICE).
