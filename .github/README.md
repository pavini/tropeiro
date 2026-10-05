# Tropeiro

**Conhecimento que chega onde a estrada termina.**

Tropeiro é um servidor de conhecimento e educação offline, pensado para o Brasil: enciclopédia, mapas, cursos, referências de saúde e um assistente de IA local, tudo rodando numa máquina só, sem depender de internet depois de instalado.

> **Status:** em preparação. Por enquanto este repositório é idêntico ao upstream, mais a infraestrutura do fork. Ainda não há release próprio do Tropeiro. Para instalar hoje, use o [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad).

## Origem

Tropeiro é um fork do [Project NOMAD](https://github.com/Crosstalk-Solutions/project-nomad), da Crosstalk Solutions, LLC, distribuído sob a [Apache License 2.0](../LICENSE). Todo o crédito pela base do projeto é deles. "Project NOMAD" e o logo do NOMAD são marcas da Crosstalk Solutions e não fazem parte deste fork; veja o [NOTICE](../NOTICE).

## O que muda em relação ao NOMAD

Planejado, em ordem:

1. **Português do Brasil na interface:** infraestrutura de i18n proposta ao upstream, com pt-BR como primeira tradução.
2. **Conteúdo brasileiro:** coleções com Wikipedia em português, mapas das regiões do Brasil e cursos do Kolibri em pt.
3. **IA em português:** modelo padrão bom em PT e RAG ajustado (stopwords, OCR) e medido com a suíte de avaliação do projeto.
4. **Referências nacionais:** bulário da ANVISA no lugar do openFDA, material de Defesa Civil e de primeiros socorros.

## Branches

| Branch | Papel |
|---|---|
| `tropeiro` | Linha principal do fork. Todo trabalho próprio parte daqui. |
| `dev`, `main` | Espelhos do upstream, atualizados por fast-forward. Nunca recebem commits deste fork. |

A sincronização é feita pelo workflow [`tropeiro-sync-upstream`](workflows/tropeiro-sync-upstream.yml), toda segunda-feira. Ele atualiza os espelhos e abre um PR de `dev` para `tropeiro`. Se houver conflito, abre uma issue no lugar do PR.

## Contribuindo

Melhorias que fazem sentido para qualquer usuário do NOMAD (i18n, suporte a ARM, correções) vão primeiro como PR para o upstream, seguindo o [CONTRIBUTING](../CONTRIBUTING.md) deles: issue antes, branch a partir de `dev`, Conventional Commits. O que é específico do Brasil fica aqui, de preferência em coleções e serviços isolados, para manter o diff com o upstream pequeno.

Para trabalhar localmente:

```bash
git clone git@github.com:pavini/tropeiro.git
cd tropeiro
git remote add upstream https://github.com/Crosstalk-Solutions/project-nomad.git
git remote set-url --push upstream DISABLED
git checkout tropeiro
```

## Licença

Apache License 2.0, a mesma do upstream. Veja [LICENSE](../LICENSE) e [NOTICE](../NOTICE).
