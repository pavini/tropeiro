# Segurança

## Versões que recebem correção

Só a versão mais recente do Tropeiro recebe correções de segurança. Se você usa uma versão antiga, atualize antes de relatar.

## Como relatar uma vulnerabilidade

**Não abra uma issue pública para uma falha de segurança.**

Use o formulário privado do GitHub:

1. Abra a [aba Security](https://github.com/pavini/tropeiro/security) do repositório.
2. Clique em **Report a vulnerability**.

O relato fica visível só para quem mantém o projeto até a correção sair. Não mande detalhes da falha em issue, PR ou comentário público.

### O que incluir

Quanto mais disto você mandar, mais rápido dá para confirmar e corrigir:

- a versão do Tropeiro e o sistema em que testou;
- a parte afetada (interface, instalador, atualização, um app instalado, a IA, o download de conteúdo...);
- os passos para reproduzir, de preferência com o comando ou a requisição exata;
- o que um atacante ganha e que acesso precisa ter para começar;
- uma sugestão de correção, se tiver.

### O que esperar

O Tropeiro é mantido por voluntários, sem prazo garantido de resposta, mas todo relato é lido. Se a falha for confirmada, a correção é feita junto com você, e você recebe o crédito no aviso publicado, a menos que prefira ficar anônimo.

## O que não é falha de segurança

O Tropeiro é feito para rodar numa rede local de confiança (em casa, num abrigo, numa comunidade). A interface não tem login por padrão: quem está na mesma rede consegue usá-la. Isso é uma escolha do projeto, não uma vulnerabilidade. Falhas que permitem acesso de fora da rede local, execução de código ou leitura de arquivos fora do que o Tropeiro serve são, sim, falhas de segurança.
