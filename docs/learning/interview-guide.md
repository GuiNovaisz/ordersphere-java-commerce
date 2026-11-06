# Guia de entrevista / Interview guide

## Português

1. **Por que monólito modular? Por que não microsserviços?** Uma compra precisa atualizar estoque e pedido atomicamente. Um processo e um banco dão uma transação local, deploy simples e limites por pacote. Não há evidência de escala ou equipes independentes que compense a distribuição.
2. **Por que `BigDecimal`?** Dinheiro em BRL precisa de representação decimal exata. O código usa duas casas e rejeita arredondamento necessário. `double` introduziria aproximações binárias.
3. **Por que copiar preço para `OrderItem`?** O preço atual do catálogo pode mudar. O snapshot preserva o preço, SKU e nome acordados naquela compra; o cliente não informa o preço final.
4. **Como evita overselling? Qual locking foi escolhido?** Uma atualização condicional subtrai saldo apenas quando `quantity >= requested`. O PostgreSQL serializa escritas na linha e reavalia a condição. A operação de estoque não usa uma sequência vulnerável de ler saldo e salvar valor calculado. O cancelamento usa lock pessimista da linha de pedido para impedir reposição dupla.
5. **O que acontece com duas compras simultâneas e uma unidade?** Uma atualização consome a unidade; a outra não encontra saldo suficiente. Deve haver um pedido persistido, um conflito e saldo final zero. Esse resultado precisa ser provado pelo teste real, não apenas explicado.
6. **Para que serve `@Transactional`? Como rollback protege estoque?** Define a unidade atômica. Se uma compra de vários produtos falhar ao consumir um deles ou persistir o pedido, os consumos anteriores são revertidos. A chamada precisa passar pelo bean transacional do Spring; uma chamada interna ao próprio objeto não ativa um novo proxy.
7. **Como ownership é garantido?** A identidade vem da sessão autenticada. Consultas e cancelamentos são restritos ao dono e ao ID do pedido; um ID de outro usuário não autoriza acesso. A resposta não revela o pedido alheio.
8. **Por que não expor entidades JPA?** Elas representam persistência, relacionamentos e estado interno. DTOs limitam entrada/saída e impedem atribuição de dono, papel ou total pelo consumidor.
9. **Por que Testcontainers?** Permite testar migrations, constraints, SQL, locks e transações no PostgreSQL real. Um banco substituto ou um mock não prova a mesma semântica.
10. **Qual a diferença entre unit e integration test?** O primeiro isola uma regra de domínio, como subtotal; o segundo verifica colaboração real entre HTTP, segurança, serviço e banco. Um teste pode passar enquanto a outra categoria revela defeitos.
11. **Como o cancelamento é idempotente?** A primeira transição de confirmado para cancelado repõe estoque. A linha do pedido é bloqueada durante a operação; uma chamada repetida observa o cancelamento e não repõe novamente.
12. **A criação é idempotente?** Não nesta versão. Reenviar `POST /orders` pode criar uma nova compra. Um futuro `Idempotency-Key` exigiria chave única por usuário, vínculo ao payload e resposta persistida de forma transacional.
13. **Por que sessão em vez de JWT?** A sessão oferece logout imediato no backend único. JWT exigiria um contrato adicional para revogação/expiração. Em troca, sessões em memória se perdem ao reiniciar e precisam de armazenamento compartilhado para múltiplas réplicas.
14. **Como evoluiria para microsserviços?** Primeiro mediria a necessidade e estabilizaria fronteiras e contratos. Separar estoque e pedidos eliminaria a transação local, exigindo decisões explícitas sobre reservas, mensagens, falhas e compensações. Não bastaria mover packages para repositórios diferentes.

## English

1. **Why a modular monolith?** One application and database provide a local purchase transaction and simple deployment. Current requirements do not justify distributed services.
2. **Why `BigDecimal`?** Exact decimal BRL amounts, two decimal places and an explicit rejection of required rounding.
3. **Why snapshot the item price?** Catalog changes must not rewrite past purchases; the server captures the commercial values.
4. **How is overselling prevented?** A conditional atomic database update consumes only sufficient inventory. PostgreSQL serializes row writes and rechecks the condition. Cancellation separately locks the order row.
5. **What happens with two buyers and one unit?** One purchase succeeds, one conflicts, one order is stored and the final balance is zero. The real integration test must prove this.
6. **What does `@Transactional` protect?** Every item consumption and order persistence form one atomic unit; a later failure rolls back earlier consumption. Spring proxy boundaries matter.
7. **How is ownership enforced?** Authenticated identity scopes order queries and cancellation by both owner and order identifier.
8. **Why DTOs instead of JPA entities?** DTOs keep persistence details private and prevent clients from assigning roles, ownership or totals.
9. **Why Testcontainers?** It exercises actual PostgreSQL migrations, constraints, SQL and lock behavior.
10. **Unit versus integration tests?** Units isolate a rule; integration tests verify collaborating infrastructure and application behavior.
11. **Is cancellation idempotent?** Yes: the locked first state transition restores stock; repeated cancellation does not restore it again.
12. **Is order creation idempotent?** No. Repeated POST requests can create separate purchases. A future key needs transactional uniqueness and payload validation.
13. **Why sessions?** Straightforward server-side logout for one backend. In-memory sessions are lost on restart and need shared storage for multiple replicas.
14. **How would this become microservices?** Establish a measured need first, then redesign cross-service inventory/order consistency. Moving packages alone would not preserve the current transaction guarantees.
