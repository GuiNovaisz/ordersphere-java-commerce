# Fluxo de desenvolvimento / Development workflow

## Português

`main` é a branch padrão e representa a versão estável; `dev` é a integração permanente. A release atual é a [v0.2.0 — Full Stack Experience](https://github.com/GuiNovaisz/ordersphere-java-commerce/releases/tag/v0.2.0), integrada em `main` e `dev`. Alterações autorizadas partem de `dev`, em uma branch de trabalho específica para a tarefa. Não crie outra branch por componente.

Antes de trabalhar, confira status, referências/upstreams e mudanças locais; use fetch sem reescrever histórico publicado. Commits devem ser semânticos e coerentes. Preserve tags v0.1.0/v0.1.1/v0.2.0. Não faça force push, merge, tag, release ou deploy sem autorização apropriada. Integrações autorizadas seguem `branch de trabalho → dev → main`, via PR e com CI verde em cada etapa.

Rode Maven `clean verify` com PostgreSQL/Testcontainers, checks frontend (`npm ci`, format:check, lint, typecheck, test, build) e Playwright contra stack descartável. Confira CI real depois do push; build local não substitui o runner. Documente evidências e limitações sem credenciais. Consulte [frontend](frontend/README.md), [operação](docs/operations.md) e [auditoria](docs/fullstack-audit.md).

Branches `dependabot/**` são manutenção automática legítima. Avalie compatibilidade e CI por atualização; não consolide, exclua ou faça merge em massa. Proteções das branches e releases existentes não são alteradas por esta milestone.

## English

`main` remains the default stable branch; `dev` is permanent integration. The current release is [v0.2.0 — Full Stack Experience](https://github.com/GuiNovaisz/ordersphere-java-commerce/releases/tag/v0.2.0), integrated into main and dev. Authorized changes start from dev on a task-specific working branch. Do not create branches per UI component.

Inspect status/refs/upstreams and preserve local changes. Use coherent semantic commits; never rewrite published history. Preserve existing tags, including v0.2.0. PRs, merges, tags, releases and public deployment require explicit task authorization. Authorized integration follows working branch → dev → main, through PRs and green CI at each step.

Run Maven verification, reproducible frontend checks and real Playwright against disposable data; inspect remote CI after pushing. Record evidence/limitations without credentials. Dependabot branches remain legitimate maintenance and require individual compatibility/CI review, without bulk merging or deletion. Existing branch protections/releases remain untouched.
