# Limpeza criteriosa — 2026-11-06

## Português

Antes: nove branches remotas (main, feature/backend-foundation e sete Dependabot), duas branches locais, árvore limpa. Main em 685d7b3, protegida por PR/check verify, sem force push/exclusão. Auditoria anterior detalhada: git-workflow-audit.md.

Todos os sete PRs tinham CI/review aprovados na base original. Decisões atuais:

| PR | Versão atual → proposta | Tipo/risco | Decisão e motivo |
| --- | --- | --- | --- |
| #1 | Temurin21 →24 | Major Java, runtime | Fechar; manter LTS21, mudança prematura sem benefício demonstrado |
| #2 | dependency-review4 →5 | Major action, risco médio | Incorporar na feature; moderniza runtime da action, revisar CI nova |
| #3 | Maven3.9.12/JDK21 → Maven3.9/JDK26 | Major JDK, risco alto | Fechar; muda toolchain e perde precisão da tag Maven |
| #4 | checkout4 →7 | Major action, risco médio | Incorporar; substitui runtime obsoleto sinalizado na CI |
| #5 | setup-java4 →6 | Major action, risco médio | Incorporar mantendo Java21; substitui action obsoleta |
| #6 | Maven3.9.12 →3.10.0 | Minor build, risco médio | Fechar por adiamento; manter wrapper/imagem alinhados, sem correção necessária demonstrada |
| #7 | upload-artifact4 →7 | Major action, risco médio | Incorporar; moderniza action, verificar upload na CI nova |

Os quatro commits de Actions foram cherry-picked com autoria preservada; conflitos de contexto entre bumps independentes foram resolvidos mantendo todas as versões propostas. Não houve merge em main nem duplicação de alteração. Após validação nova, os PRs incorporados por outro caminho são fechados e suas branches tornam-se obsoletas. Os três PRs adiados também são fechados com justificativa, preservando seus commits no histórico dos PRs.

Configuração proposta: semanal, limites Maven2/Actions2/Docker1; grupos minor/patch por ecossistema. Majors ficam fora dos grupos. Runtime Java major é bloqueado; imagens build JDK24/25/26 são adiadas. Alertas e atualizações de segurança permanecem habilitados. Sintaxe conferida na documentação oficial: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference

IMPORTANTE: esta configuração está na feature. Dependabot lê a configuração da branch padrão; ela só se tornará ativa após integração futura autorizada. Não foi feito merge da feature em main para ativá-la. Fechar PRs existentes evita duplicação imediata; novas atualizações legítimas ainda podem aparecer.

Verificação: CI nova da feature executa clean verify (unitários, integração PostgreSQL, segurança, concorrência), build Docker e upload de relatórios. Main e release existente ficam intactas. Nenhuma nova tag/release criada. Todo o desenvolvimento restante da OrderSphere Backend Foundation continuará em feature/backend-foundation.

## English

Before cleanup: nine remote branches, including seven independent bot branches; two local branches and a clean tree. Main remains protected and unchanged at685d7b3.

Actions PRs2/4/5/7 are incorporated via authored cherry-picks on the development branch to replace obsolete action runtimes, keeping Java21. Their combined changes receive a fresh full CI run, including PostgreSQL/security/concurrency tests, Docker build and artifact upload. PRs1/3 are deferred to retain the Java21 toolchain; PR6 is deferred to preserve wrapper/image alignment without a demonstrated need. Resolved PRs are closed with reasons and obsolete bot branches removed; no bulk merging or main history rewriting occurs.

The proposed weekly configuration limits Maven/Actions/Docker PRs to2/2/1 and groups only minor/patch updates. Major upgrades remain separate, with explicit Java-image exclusions. Security monitoring remains enabled. Because the configuration lives on the feature branch, default-branch activation awaits a future authorized integration. No merge, new tag or release is part of this cleanup.
