# Auditoria Git/GitHub — 2026-11-06

## Português

Estado anterior: branch `main`, HEAD e `origin/main` em `685d7b34711e71a2913ff630e1c2661b7bbbe421`, sem alterações locais ou commits exclusivos nesta cópia. Onze commits estavam publicados em main, incluindo backend, testes, documentação, preparação de release e MIT. A tag `v0.1.0` aponta para `9964317`; a release já havia sido publicada com autorização anterior e foi preservada.

Referências: `origin` = https://github.com/GuiNovaisz/ordersphere-java-commerce.git. A branch `feature/backend-foundation` não existia nesta cópia nem no remoto. Foi criada a partir de `origin/main` em `685d7b3`; não houve recriação de commits, reset, rebase ou force push. A cópia anterior contém a antiga branch local de trabalho, cujo conteúdo já está integrado no histórico publicado. Nenhum trabalho desse histórico foi descartado.

CI de main: o check `verify` no commit `685d7b3` passou: [execução 42272582471](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/runs/42272582471). As execuções anteriores de main consultadas também estavam aprovadas; a consulta de execuções com status failure não retornou resultados. Não há evidência disponível para determinar a causa histórica do indicador 0/1. Ele não representa uma falha atual comprovada; estado pendente é apenas uma hipótese, não uma conclusão. Nenhuma correção de código/workflow é justificada por esse indicador isolado.

### Dependabot

Os sete PRs abertos são exclusivamente de `app/dependabot`, base `main`, branches `dependabot/**`. Todos apresentaram `verify` e `review` aprovados na auditoria, sobre suas bases originais. Isso não substitui reteste contra a base mais recente antes de integrar.

| PR | Atualização | Tipo/impacto | Avaliação |
| --- | --- | --- | --- |
| [1](https://github.com/GuiNovaisz/ordersphere-java-commerce/pull/1) | Temurin runtime 21 → 24 | Major Java; muda runtime LTS planejado | Adiar; CI passa, mas não há necessidade de abandonar Java 21 |
| [2](https://github.com/GuiNovaisz/ordersphere-java-commerce/pull/2) | dependency-review-action 4 → 5 | Major da action | Candidato a revisão separada; CI passa no runner usado |
| [3](https://github.com/GuiNovaisz/ordersphere-java-commerce/pull/3) | Maven 3.9.12/Temurin 21 → Maven 3.9/Temurin 26 | Major JDK e tag Maven menos específica | Adiar; muda toolchain e reprodutibilidade sem necessidade demonstrada |
| [4](https://github.com/GuiNovaisz/ordersphere-java-commerce/pull/4) | checkout 4 → 7 | Major da action | Candidato; compatibilidade exercitada pelo runner, revisar mudanças e retestar base atual |
| [5](https://github.com/GuiNovaisz/ordersphere-java-commerce/pull/5) | setup-java 4 → 6 | Major da action | Candidato; manter Java 21 e revisar mudanças antes de integrar |
| [6](https://github.com/GuiNovaisz/ordersphere-java-commerce/pull/6) | Maven Wrapper distribution 3.9.12 → 3.10.0 | Minor Maven; altera ferramenta de build | Candidato; preservar alinhamento com imagem Maven e validar build completo |
| [7](https://github.com/GuiNovaisz/ordersphere-java-commerce/pull/7) | upload-artifact 4 → 7 | Major da action | Candidato; CI e upload passaram, revisar comportamento e retestar |

Nenhum PR foi mesclado, fechado ou apagado. Não há PR humano aberto para esta correção. O fluxo futuro e as regras pragmáticas de main estão em [CONTRIBUTING](../CONTRIBUTING.md). A proteção exige PR, check `verify` atualizado, impede force push/exclusão e não exige aprovação externa.

## English

Before correction, clean local `main` matched `origin/main` at `685d7b3`; no local unpublished commits existed. The published history and existing v0.1.0 tag/release were retained. The new human/agent branch starts at that exact main commit; subsequent workflow documentation belongs to it, with its own remote upstream. No published history was rewritten.

Main's latest `verify` check passed ([run](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/runs/42272582471)); queried earlier main runs passed and the failed-run query returned no results. The historical 0/1 indicator cannot be explained conclusively from the available evidence. Pending execution is only a hypothesis.

All seven open PRs belong to Dependabot and had successful build/review checks on their original bases. The table above records exact versions, change categories and impact. JDK24/26 image changes are deferred because they abandon the Java21 toolchain without demonstrated need. Action major upgrades and Maven3.10 are candidates for separate review and fresh-base testing, not automatic merges. All bot branches/PRs remain intact.

Main protection requires a PR and up-to-date `verify`, blocks force pushes/deletion and does not require another developer's approval. All remaining Backend Foundation work follows [CONTRIBUTING](../CONTRIBUTING.md); no new release or future frontend branch is created by this correction.
