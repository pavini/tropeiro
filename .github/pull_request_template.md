## O que muda

<!-- O que este PR faz e por quê. Se resolve uma issue: "Resolve #123". -->

## Como testar

<!-- Passos para conferir, incluindo a tela no navegador se mexeu na interface. -->

## Verificações

- [ ] Um assunto só neste PR
- [ ] Typecheck sem erros novos (`npx tsc --noEmit -p tsconfig.json` e `-p inertia/tsconfig.json` em `admin/`)
- [ ] Testes do que mudou rodando (`node --import ts-node-maintained/register/esm --test tests/unit/...`)
- [ ] Textos novos traduzidos em `pt-BR.json` e o teste de tradução passando
- [ ] Se mexeu em `conteudo/`: `npm run conteudo:validar` passando e fonte oficial citada
- [ ] Se mexeu na IA (busca, prompts, modelo, documentos): números de antes e depois abaixo
- [ ] Sem rodapés de ferramentas no commit e nesta descrição

## Medição (se mexeu na IA)

<!-- Ver docs/ia/busca.md. Ex.: busca 31/40 → 36/40 entre os 5 primeiros; respostas de emergência 86/89 → 87/89. -->
