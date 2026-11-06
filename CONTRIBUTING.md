# Fluxo de desenvolvimento / Development workflow

## Português

`main` é a branch padrão e representa a versão estável; `dev` é a integração permanente. A Backend Foundation está publicada em v0.1.1. Esta milestone trabalha somente em `feature/fullstack-experience`, criada de `dev`, com upstream `origin/feature/fullstack-experience`. Não crie outra branch por componente.

Antes de trabalhar, confira status, referências/upstreams e mudanças locais; use fetch sem reescrever histórico publicado. Commits devem ser semânticos e coerentes. Preserve tags v0.1.0/v0.1.1. Não faça force push, merge, tag, release ou deploy sem autorização apropriada. Na missão v0.2.0, publique somente a feature e pare para revisão; **não abra PR automaticamente**. A futura integração autorizada seguirá `feature → dev → main`, com validação em cada etapa.

Rode Maven `clean verify` com PostgreSQL/Testcontainers, checks frontend (`npm ci`, format:check, lint, typecheck, test, build) e Playwright contra stack descartável. Confira CI real depois do push; build local não substitui o runner. Documente evidências e limitações sem credenciais. Consulte [frontend](frontend/README.md), [operação](docs/operations.md) e [auditoria](docs/fullstack-audit.md).

Branches `dependabot/**` são manutenção automática legítima. Avalie compatibilidade e CI por atualização; não consolide, exclua ou faça merge em massa. Proteções das branches e releases existentes não são alteradas por esta milestone.

## English

`main` remains the default stable branch; `dev` is permanent integration. Backend Foundation is released as v0.1.1. Work for this milestone belongs solely on `feature/fullstack-experience`, based on dev and tracking its matching origin branch. Do not create branches per UI component.

Inspect status/refs/upstreams and preserve local changes. Use coherent semantic commits; never rewrite published history. Preserve existing tags. This mission authorizes feature pushes only: **no automatic PR, merge, tag, release or public deployment**. Stop for review. Future authorized integration follows feature → dev → main with verification at each step.

Run Maven verification, reproducible frontend checks and real Playwright against disposable data; inspect remote CI after pushing. Record evidence/limitations without credentials. Dependabot branches remain legitimate maintenance and require individual compatibility/CI review, without bulk merging or deletion. Existing branch protections/releases remain untouched.
