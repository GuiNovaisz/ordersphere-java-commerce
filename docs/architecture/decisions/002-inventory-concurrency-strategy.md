# ADR 002 — Concorrência de estoque / Inventory concurrency

## Português

**Estado:** aceito; comprovação de execução registrada na [auditoria](../../audit.md).

**Problema:** duas compras simultâneas não podem confirmar a mesma unidade. Consultar saldo e depois salvar um novo valor permite uma atualização perdida.

| Alternativa | Benefício | Custo |
| --- | --- | --- |
| Optimistic locking com `@Version` | Detecta escrita concorrente sem bloquear na leitura | Requer tratamento de conflito; repetir a compra inteira precisa de política explícita |
| Pessimistic locking na leitura | Serializa acesso ao saldo antes do cálculo | Mantém lock por mais tempo; envolve leitura e atualização |
| `UPDATE` condicional atômico | Banco verifica saldo e subtrai na mesma instrução | Não entrega o novo saldo diretamente; atualização em massa exige atenção ao contexto JPA |

**Decisão:** atualização atômica condicional, conceitualmente:

```sql
UPDATE inventory
SET quantity = quantity - :requested
WHERE product_id = :productId
  AND quantity >= :requested;
```

Uma linha atualizada significa consumo aceito. Zero significa saldo insuficiente ou recurso indisponível e gera conflito de domínio. A transação do pedido inclui todos os consumos e a persistência dos snapshots. Qualquer falha desfaz o conjunto. A constraint de saldo não negativo reforça o Java.

No isolamento padrão `READ COMMITTED`, duas atualizações da mesma linha competem pelo lock de escrita do PostgreSQL. A segunda reavalia a condição depois da primeira. Com saldo inicial 1 e duas solicitações de 1, só uma pode consumir. Não são dois `SELECT` independentes seguidos de `save`.

Itens são processados por UUID em ordem estável. O cancelamento usa lock pessimista na linha do pedido para que apenas a primeira chamada altere o estado e reponha estoque. O saldo é reposto na mesma transação.

**Verificação exigida:** teste de integração com PostgreSQL/Testcontainers, barreira de início e duas chamadas concorrentes: um pedido aceito, um conflito, um pedido persistido e saldo final zero. O teste de rollback com vários itens prova atomicidade além do caso de uma unidade. Arquivos e resultado real estão na [auditoria](../../audit.md).

**Limitações:** esta estratégia não elimina toda espera, timeout ou deadlock; transações curtas e ordem estável reduzem o risco. Não há retry automático de criação de pedido nem `Idempotency-Key` nesta versão.

## English

**Status:** accepted; execution evidence belongs in the [audit](../../audit.md).

Reading a balance and later saving a derived value can lose concurrent updates. Optimistic locking detects stale writes but needs an explicit retry/conflict policy. Pessimistic reads serialize access but hold locks earlier. We choose the conditional atomic update shown above: PostgreSQL verifies sufficient inventory and subtracts it in one statement.

One affected row means success; zero means the requested consumption was rejected. Every consumption and the order snapshot are part of the same transaction, so a later failure rolls everything back. A database constraint also rejects negative inventory.

At PostgreSQL's default `READ COMMITTED` isolation, competing updates acquire a row write lock and re-evaluate the condition after the preceding update. Starting with one unit, two purchases of one unit cannot both succeed. Stable product UUID order reduces lock cycles. Cancellation separately locks the order row and restores inventory only for the first state transition.

The required PostgreSQL/Testcontainers test synchronizes two purchase requests and asserts one success, one conflict, one stored order and a zero final balance. A multi-item rollback test checks atomicity. This design does not remove all lock waits, timeouts or deadlocks. Order creation has no automatic retry or idempotency key in this version.
