# Relatório de implementação / Implementation report

## Português

| Entrega | Resultado e referência |
| --- | --- |
| Arquitetura | Monólito modular, Java 21, Spring Boot 4.1.2, seis pacotes por domínio. [Visão geral](architecture/overview.md) |
| Funcionalidades | Autenticação, catálogo, estoque e pedidos. [Sumário do projeto](../README.md#funcionalidades) |
| Endpoints | Cadastro/login/logout/identidade/CSRF; catálogo público; catálogo e estoque ADMIN; pedidos próprios. [Contratos e exemplos](api.md) |
| Modelagem | AppUser, Product, Inventory, CustomerOrder e OrderItem; UUIDs, constraints e snapshots. [Migration V1](../src/main/resources/db/migration/V1__foundation.sql) |
| Concorrência | UPDATE condicional, transação única e produtos em ordem UUID; cancelamento bloqueia o pedido. [ADR002](architecture/decisions/002-inventory-concurrency-strategy.md) |
| Testes | 5 unitários + 16 integração; sem falhas, erros ou skips. [Relatórios](audit.md) |
| Teste concorrente | Duas compras HTTP sincronizadas para uma unidade: 201 + 409, um pedido, saldo 0. [BackendIT](../src/test/java/com/ordersphere/BackendIT.java) |
| Segurança | BCrypt (cost 12), sessão HttpOnly, CSRF, RBAC, ownership, validação e rejeição de campos desconhecidos. [Estratégia](architecture/decisions/004-authentication-strategy.md) |
| Docker | Multi-stage, Java 21, usuário sem root, Compose com PostgreSQL 17, rede/volume e health checks aprovados. [Operação](operations.md) |
| CI | GitHub Actions executa clean verify com PostgreSQL real e build da imagem. [Workflow](../.github/workflows/ci.yml), [evidência remota](audit.md) |
| Documentação | README PT-BR/EN com sumário, Mermaid, quatro ADRs, API, operação, conceitos, entrevistas e exercícios. [Índice](../README.md#documentacao) |
| Commits | Incrementais: fundação, comércio, testes, autenticação, containers/CI, contratos e documentação. Histórico disponível no GitHub e em `git log --oneline` |
| Branch | Desenvolvimento em `feature/backend-foundation`, integração local fast-forward em `main`; publicação em `origin/main`, sem force push |
| Git status | Árvore limpa e sincronizada com `origin/main` na verificação final; `.env` e `target/` ignorados |
| Limitações | BRL; sem pagamentos/frontend; sessões locais; POST de compra sem Idempotency-Key; rate limiting delegado ao proxy. JUnit 6 por compatibilidade comprovada do Spring atual |
| Release notes | [v0.1.0 bilíngue](release-notes-v0.1.0.md). [GitHub Release v0.1.0](https://github.com/GuiNovaisz/ordersphere-java-commerce/releases/tag/v0.1.0) |
| Prontidão | Backend local auditado; resultado de CI registrado na [auditoria](audit.md). Publicação da versão autorizada pelo proprietário |

Próxima evolução: planejar v0.2.0 com frontend consumindo a REST API existente. Não foram introduzidos microsserviços ou dependências de frontend.

## English

| Deliverable | Result and reference |
| --- | --- |
| Architecture | Java 21/Spring Boot 4.1.2 modular monolith with six domain packages. [Overview](architecture/overview.md) |
| Features | Authentication, catalog, inventory and orders. [Project contents](../README.md#features) |
| Endpoints | Registration/login/logout/identity/CSRF, public catalog, ADMIN management and owner-scoped orders. [API](api.md) |
| Data model | AppUser, Product, Inventory, CustomerOrder and OrderItem with constraints and historical snapshots. [Migration](../src/main/resources/db/migration/V1__foundation.sql) |
| Concurrency | Conditional atomic updates inside one transaction; stable UUID ordering; order-row locks for cancellation. [ADR002](architecture/decisions/002-inventory-concurrency-strategy.md) |
| Tests | 5 unit and 16 integration tests, zero failures/errors/skips. [Evidence](audit.md) |
| Concurrent purchase test | Two synchronized HTTP purchases for one unit produce 201 + 409, one stored order and zero stock. [BackendIT](../src/test/java/com/ordersphere/BackendIT.java) |
| Security | BCrypt (cost 12), HttpOnly sessions, CSRF, RBAC, ownership and strict request validation. [Authentication ADR](architecture/decisions/004-authentication-strategy.md) |
| Docker | Java 21 multi-stage image, non-root user, PostgreSQL 17 Compose, network, volume and verified health checks. [Operations](operations.md) |
| CI | Actions runs clean verify against real PostgreSQL and builds the image. [Workflow](../.github/workflows/ci.yml), [remote evidence](audit.md) |
| Documentation | Portuguese first, then English; linked README contents, Mermaid, four ADRs, API/operations, learning guide, interview questions and exercises. [Index](../README.md#documentation) |
| Commits | Incremental foundation, commerce, security, tests, CI/containers and documentation commits; inspect the GitHub history or `git log --oneline` |
| Branch | Work on `feature/backend-foundation`, local fast-forward into `main`, pushed to `origin/main` without force |
| Git status | Clean and synchronized with `origin/main` at final verification; local environment/build output ignored |
| Limitations | BRL only; no payments/frontend; process-local sessions; purchase POST has no idempotency key; proxy rate limiting. JUnit 6 retained for verified Spring compatibility |
| Release notes | [Bilingual v0.1.0 notes](release-notes-v0.1.0.md); [v0.1.0 GitHub Release](https://github.com/GuiNovaisz/ordersphere-java-commerce/releases/tag/v0.1.0) |
| Readiness | Local backend audit passed; see [audit](audit.md) for remote CI results. Version publication authorized by the owner |

The next planned milestone is a v0.2.0 frontend using the existing REST contracts. No microservices or frontend dependencies were added.
