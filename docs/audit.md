# Auditoria v0.1.0 / v0.1.0 audit

## Português

Auditoria executada em **6 de novembro de 2026**, Windows, JDK 25.0.5 com alvo Java 21, Maven Wrapper 3.9.12 e Docker Engine 29.9.2. **Verificações locais e CI remoto aprovados.** O runner Ubuntu também executou a suíte com Java 21.

| Verificação | Evidência esperada | Resultado |
| --- | --- | --- |
| Build limpo | `.\mvnw.cmd -B -ntp clean verify` | PASS, exit 0, BUILD SUCCESS |
| Regras puras | [Surefire](verification/unit-tests.txt) | 5 testes, 0 falhas, 0 erros, 0 ignorados |
| PostgreSQL e Flyway | Testcontainers PG17 e volume novo Compose; schema JPA validate | PASS, V1 aplicada; consulta SQL `1\|t` |
| Integração e API | [Failsafe](verification/integration-tests.txt) | 16 testes, 0 falhas, 0 erros, 0 ignorados |
| Segurança | Sem auth, CSRF, RBAC, ownership, logout, mass assignment, rotação de sessão/CSRF | PASS |
| Concorrência | `twoSimultaneousHttpPurchasesCannotOversellOneUnit`, duas chamadas HTTP com barreira | PASS: 201 + 409, 1 pedido persistido, saldo 0 |
| Atomicidade e histórico | Rollback de vários itens, snapshot, cancelamentos repetidos/concorrentes, teto de reposição | PASS |
| OpenAPI | `/v3/api-docs` e `/swagger-ui/index.html` no Compose | PASS, OpenAPI 3.1 e UI HTTP 200 |
| Docker | Multi-stage Java21; Compose API+PG17; health checks; usuário sem root | PASS, ambos healthy, uid100 ordersphere |
| CI remoto | [Backend CI, código auditado 50a4afb](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/runs/42259641476) | SUCCESS: clean verify, testes reais PostgreSQL e build Docker |
| Git | Trabalho em `feature/backend-foundation`; integração local em `main` antes do push | Commits incrementais, sem force push |
| Credenciais | `.env` e `target/` ignorados; credenciais sintéticas da auditoria fora do repo | PASS, scan local antes do push |
| Documentação | README PT-BR/EN, links e contratos conferidos com o código | PASS |

O [smoke test do Compose](verification/compose-smoke.json) executou login administrativo, criação de produto, ajuste de estoque, cadastro/login de cliente, compra, dois cancelamentos e logout. O banco não publicou porta no host; a API usou uma porta loopback livre porque 18080 já estava ocupada por outro serviço, que foi preservado.

A combinação gerenciada usa JUnit Jupiter 6.0.3. A tentativa de forçar JUnit5.14.4 falhou em SpringExtension com NoSuchMethodError e foi revertida; a suíte final com a versão compatível passou integralmente. Logs locais completos ficam fora do repositório; os relatórios sanitizados acima permitem conferir contagem e resultado.

### Critério de prontidão

Build, banco, autenticação, RBAC, ownership, snapshots, atomicidade, teste concorrente, Docker e CI essenciais foram aprovados. A fundação backend está pronta para revisão de publicação da v0.1.0, respeitando as limitações documentadas. Repositório e push foram autorizados e executados; publicação da tag e da GitHub Release v0.1.0 autorizada pelo proprietário. Os containers exclusivos da auditoria foram encerrados; o volume foi preservado e serviços preexistentes não foram interrompidos. Secret scanning, proteção de push, alertas e atualizações de segurança Dependabot e canal privado de vulnerabilidades foram habilitados no repositório.

## English

Verified on **November 6, 2026**, on Windows using JDK 25.0.5 targeting Java 21, Maven Wrapper 3.9.12 and Docker 29.9.2. **Local checks and [remote CI](https://github.com/GuiNovaisz/ordersphere-java-commerce/actions/runs/42259641476) passed**, including the Ubuntu runner's Java 21 build, PostgreSQL tests and Docker image.

The clean build returned exit0: [5 unit tests](verification/unit-tests.txt) and [16 PostgreSQL17 integration tests](verification/integration-tests.txt), with zero failures, errors or skips. Real synchronized HTTP purchases produced one201, one409, one persisted order and zero remaining stock. Tests also verified rollback, historical snapshots, concurrent/repeated cancellation, ownership, RBAC, session/CSRF rotation and invalid input.

The multi-stage Java21 Docker image runs as a non-root user. A fresh Compose environment applied Flyway V1, passed both health checks, served Swagger/OpenAPI and passed the [full smoke flow](verification/compose-smoke.json). PostgreSQL has no published host port; the API binds to loopback. An occupied audit port was replaced without interrupting the existing service. Secrets remained outside Git. JUnit Jupiter6.0.3 is retained because forcing JUnit5.14.4 was incompatible with SpringExtension; the final compatible suite passed.

The backend foundation is ready for release review within its documented limitations. Repository creation and push were authorized and completed; the owner authorized publication of the v0.1.0 tag and GitHub Release. Task-owned audit containers were stopped, with the volume preserved and preexisting services untouched. Repository secret scanning, push protection, Dependabot alerts/security updates and private vulnerability reporting were enabled.
