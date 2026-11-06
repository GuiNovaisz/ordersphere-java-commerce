# Fluxo de desenvolvimento / Development workflow

## Português

`main` representa o último estado integrado. Todo desenvolvimento humano/agente restante da Backend Foundation ocorre exclusivamente em `feature/backend-foundation`, incluindo código, testes, segurança, Docker, CI e documentação. Use commits pequenos e coerentes; não crie branches separadas por domínio nesta milestone.

Antes de trabalhar, confira `git status`, atualize referências com `git fetch origin` e preserve alterações locais. Trabalhe em `feature/backend-foundation`, com upstream `origin/feature/backend-foundation`. Integre mudanças posteriores de `main` sem reescrever commits publicados.

Quando o trabalho estiver pronto, execute testes e auditoria, abra PR para `main` e aguarde autorização explícita do proprietário antes do merge. `main` exige PR e o check `verify`, sem aprovação obrigatória de outro desenvolvedor. Não faça force push, exclusão de branches ou reescrita de histórico para reorganizar trabalho publicado.

Branches `dependabot/**` são manutenção automática legítima e não violam a regra de uma branch humana/agente. Avalie versão, compatibilidade, impacto e CI de cada PR separadamente. Não consolide, exclua ou faça merge em massa.

A tag e a release `v0.1.0` já existiam quando este fluxo foi corrigido e serão preservadas. Não recrie nem mova essa tag. Qualquer publicação posterior exige versão e autorização adequadas. Não crie a branch futura `feature/fullstack-experience` nesta etapa.

## English

`main` represents the last integrated state. All remaining human/agent Backend Foundation work belongs exclusively on `feature/backend-foundation`, including code, tests, security, Docker, CI and documentation. Use small coherent commits rather than separate feature branches per domain.

Inspect status, fetch remote refs and preserve local changes before switching. Track `origin/feature/backend-foundation`; integrate later `main` changes without rewriting published commits.

After tests and audit, open a PR into `main` and obtain the owner's explicit authorization before merging. Main requires a PR and the `verify` check, with no mandatory approval from another developer. Never force-push, delete branches or rewrite published history to reorganize the project.

`dependabot/**` branches are legitimate automated maintenance. Review each dependency update, compatibility, impact and CI independently. Do not consolidate, delete or merge them in bulk.

The existing `v0.1.0` tag/release predate this workflow correction and remain preserved. Do not recreate or move that tag. Later releases need an appropriate version and authorization. Do not create the future Full Stack branch yet.
