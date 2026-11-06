# Fluxo de desenvolvimento / Development workflow

## Português

`main` representa o último estado integrado. Todo desenvolvimento humano/agente restante da Backend Foundation ocorre exclusivamente em `feature/backend-foundation`, incluindo código, testes, segurança, Docker, CI e documentação. Use commits pequenos e coerentes; não crie branches separadas por domínio nesta milestone.

Antes de trabalhar, confira `git status`, atualize referências com `git fetch origin` e preserve alterações locais. Trabalhe em `feature/backend-foundation`, com upstream `origin/feature/backend-foundation`. Integre mudanças posteriores de `main` sem reescrever commits publicados.

O fluxo atual é `feature/backend-foundation → dev → main`. `dev` é a branch permanente de integração, criada da base estável `685d7b3`; a feature existente foi preservada. Quando o trabalho estiver pronto, execute testes e auditoria e prepare PR para `dev`. Nenhum merge é automático. Depois da integração, valide novamente em `dev`; a promoção `dev → main` exige autorização explícita. `main` exige PR e o check `verify`, sem aprovação externa obrigatória. `dev` bloqueia force push e exclusão; a CI foi preparada para pushes em `dev` e PRs. Não reescreva histórico publicado. Novas features futuras partirão de `dev`, sem criar branches antecipadamente.

Branches `dependabot/**` são manutenção automática legítima e não violam a regra de uma branch humana/agente. Avalie versão, compatibilidade, impacto e CI de cada PR separadamente. Não consolide, exclua ou faça merge em massa.

A tag e a release `v0.1.0` já existiam quando este fluxo foi corrigido e serão preservadas. Não recrie nem mova essa tag. Qualquer publicação posterior exige versão e autorização adequadas. Não crie a branch futura `feature/fullstack-experience` nesta etapa.

## English

`main` represents the last integrated state. All remaining human/agent Backend Foundation work belongs exclusively on `feature/backend-foundation`, including code, tests, security, Docker, CI and documentation. Use small coherent commits rather than separate feature branches per domain.

Inspect status, fetch remote refs and preserve local changes before switching. Track `origin/feature/backend-foundation`; integrate later `main` changes without rewriting published commits.

The current flow is `feature/backend-foundation → dev → main`. Permanent integration branch `dev` starts at stable commit `685d7b3`; the existing feature history is preserved. After tests and audit, prepare a PR into `dev`, without automatic merges. Revalidate integration on `dev`; promoting `dev → main` requires explicit authorization. Main requires a PR and `verify`, without external approval. Dev blocks force push/deletion; CI includes dev pushes and PRs. Future features start from dev when needed. Never rewrite published history.

`dependabot/**` branches are legitimate automated maintenance. Review each dependency update, compatibility, impact and CI independently. Do not consolidate, delete or merge them in bulk.

The existing `v0.1.0` tag/release predate this workflow correction and remain preserved. Do not recreate or move that tag. Later releases need an appropriate version and authorization. Do not create the future Full Stack branch yet.
