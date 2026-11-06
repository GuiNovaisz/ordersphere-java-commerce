# Exercícios / Exercises

## Português

Faça os exercícios em uma branch própria e confirme os testes existentes. Os desafios abaixo não incluem soluções.

### Fundamentos — Java puro

1. Crie um enum com os estados `CONFIRMED` e `CANCELLED`; imprima uma mensagem diferente para cada estado usando `switch`.
2. Crie um record que receba identificador de produto e quantidade. Rejeite quantidade zero ou negativa no construtor.
3. Calcule subtotal de quatro itens de R$ 12,35 usando `BigDecimal`. Investigue a diferença entre `equals` e `compareTo` com escalas distintas.
4. Receba uma lista de linhas e some subtotais sem `double`. Rejeite lista vazia.

### POO — domínio

1. Modele um saldo encapsulado com adicionar e consumir. Garanta que uma operação inválida não altere o objeto.
2. Implemente uma regra que permita cancelar um pedido confirmado e defina o resultado da segunda chamada.
3. Crie um snapshot de produto e altere o catálogo original. Escreva um teste que prove que o histórico não mudou.
4. Explique, com um exemplo do projeto, por que composição não exige herança e injeção não exige uma interface para cada classe.

### Spring — próximos passos

1. Adicione um filtro de faixa de preço ao catálogo, com validação de mínimo/máximo e testes de paginação.
2. Crie um endpoint autenticado que retorne uma informação adicional do próprio perfil, sem aceitar ID de outro usuário.
3. Adicione um teste que tente consultar pedido alheio e explique por que a resposta deve ser indistinguível de recurso ausente.
4. Estenda o teste concorrente para uma quantidade pequena de compradores, sem transformar a tarefa em teste de estresse. Preserve asserts sobre saldo e total de itens vendidos.
5. Projete no papel uma chave de idempotência para criação de pedido. Explique corrida pela mesma chave, payload diferente, rollback e repetição após timeout antes de implementar.

## English

Use a separate branch and keep existing tests passing. No solutions are supplied here.

### Fundamentals — plain Java

1. Create a `CONFIRMED`/`CANCELLED` enum and a `switch` message for each state.
2. Create a product/quantity record that rejects nonpositive quantities.
3. Calculate four items at BRL 12.35 with `BigDecimal`; compare `equals` and `compareTo` across scales.
4. Sum line subtotals without floating-point arithmetic and reject an empty list.

### Object-oriented domain work

1. Encapsulate an inventory balance and ensure rejected operations leave it unchanged.
2. Model cancellation and define the second cancellation result.
3. Snapshot a product, change the catalog and test that history remains stable.
4. Explain composition, inheritance, injection and interfaces using concrete project examples.

### Spring — future exercises

1. Add a validated price-range catalog filter and pagination tests.
2. Extend the authenticated user's own profile without accepting another user's ID.
3. Test foreign-order access and explain the absent-resource response.
4. Extend the concurrency test to a small number of buyers while asserting stock and sold quantities.
5. Design idempotency-key uniqueness, payload matching, rollback and timeout behavior before implementing it.
