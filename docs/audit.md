# Auditoria v0.1.0 / v0.1.0 audit

## Português

Este documento registra evidências reais. A presença de código ou de um workflow não prova execução bem-sucedida. **Estado inicial: auditoria pendente.** Atualizar esta tabela somente após executar cada verificação.

| Verificação | Evidência esperada | Resultado |
| --- | --- | --- |
| Build limpo | `mvnw clean verify`, código de saída e relatórios | Pendente |
| Regras puras | Surefire: testes, falhas e erros | Pendente |
| PostgreSQL e Flyway | Banco novo, migration V1 aplicada, schema validado | Pendente |
| Integração e API | Failsafe: testes, falhas e erros | Pendente |
| Segurança | Sem auth, CSRF, RBAC, ownership, logout e payload | Pendente |
| Concorrência | Saldo 1, duas compras: sucesso 1, conflito 1, saldo 0 | Pendente |
| Atomicidade e histórico | Rollback de vários itens, snapshot, cancelamento repetido | Pendente |
| OpenAPI | `/v3/api-docs` e Swagger UI respondem | Pendente |
| Docker | Build de imagem e Compose do zero com health checks | Pendente |
| CI remoto | URL da execução e conclusão | Pendente |
| Git | Branch, commits, status limpo, remote verificado | Pendente |
| Credenciais | `.env` ignorado, nenhum secret real versionado | Pendente |
| Documentação | Contratos e comandos conferidos com o código | Pendente |

### Critério de prontidão

A v0.1.0 não está aprovada enquanto build, banco, autenticação, RBAC, ownership, snapshots, atomicidade, teste concorrente, Docker e CI essenciais não tiverem evidências aprovadas. Se uma dependência de ambiente impedir execução, registrar o bloqueio e manter a release como preparada, sem afirmar prontidão.

## English

This file records actual evidence. Source code and a workflow definition do not prove successful execution. **Initial status: audit pending.** Update the table only after running each check.

Release approval requires a clean build, unit and PostgreSQL integration tests, authentication, RBAC, ownership, snapshot and rollback checks, the real two-purchase concurrency test, working Docker execution and essential CI checks. Record blocked environment dependencies explicitly. Prepared release notes do not imply a released or approved version.
