# Guia de leitura / Reading guide

## Português

Leia primeiro Java puro em `Product` e `OrderItem`, depois acompanhe uma compra do controller ao banco. Cada bloco propõe uma mudança pequena; não é necessário dominar Spring antes de entender uma quantidade ou um subtotal.

### Classes, objetos e encapsulamento

**Conceito:** classe define estado e comportamento; objeto é uma instância. Encapsular significa controlar as formas válidas de mudar esse estado.

**Onde:** [`Product`](../../src/main/java/com/ordersphere/catalog/Product.java) possui campos privados e um método `update`. Dois produtos são dois objetos, com identificadores e preços próprios.

**Por quê:** `update` normaliza SKU e verifica preço antes de armazená-los. Um setter público que aceitasse qualquer valor permitiria estado inválido.

**Alternativa:** deixar todos os campos públicos é simples no começo, mas espalha a obrigação de validar por todos os chamadores.

**Exercício:** escreva, em Java puro, uma classe de saldo que rejeite consumo acima do disponível.

### Records e enums

**Conceito:** record representa dados com componentes finais e sem setters; enum representa um conjunto fechado de opções.

**Onde:** [`ProductRequest`](../../src/main/java/com/ordersphere/catalog/ProductRequest.java) e [`ProductView`](../../src/main/java/com/ordersphere/catalog/ProductView.java) transportam dados sem expor a entidade. O status de pedido expressa os estados permitidos pelo domínio.

**Por quê:** a request não pode atribuir identificador, dono ou total arbitrários. Uma coleção dentro de um record ainda precisa de cópia defensiva para ser imutável.

**Alternativa:** uma classe comum funciona, mas exige construtor e acessores explícitos; strings soltas para estados permitem erros de digitação.

**Exercício:** crie um record `PurchaseLine` e um enum de dois estados. Explique por que record não é a escolha desta aplicação para uma entidade JPA.

### BigDecimal e cálculo

**Conceito:** `BigDecimal` representa decimais com precisão definida, sem as aproximações binárias de `double`.

**Onde:** `Product.update` aplica `setScale(2, RoundingMode.UNNECESSARY)` e o item do pedido multiplica quantidade por preço. Use `new BigDecimal("19.90")`, com string.

**Por quê:** esta API suporta BRL e rejeita valores que precisariam de arredondamento. `UNNECESSARY` declara que perder casas decimais não é permitido; não é uma política de arredondar silenciosamente.

**Alternativa:** centavos em `long` também podem funcionar em um domínio simples, mas exigem conversões explícitas. `double` não foi escolhido para dinheiro.

**Exercício:** calcule três unidades de 19,90 e compare duas representações com escalas diferentes usando `compareTo` e `equals`.

### Interfaces, composição e injeção de dependência

**Conceito:** interface é um contrato Java; composição combina objetos; injeção entrega dependências em vez de criá-las dentro do consumidor.

**Onde:** [`ProductRepository`](../../src/main/java/com/ordersphere/catalog/ProductRepository.java) estende contratos Spring Data. `CatalogService` recebe repository e inventário no construtor.

**Por quê:** o Spring cria a implementação do repository e conecta os objetos. A service trabalha com dependências explícitas. Interface não é sinônimo de dependency injection ou dependency inversion.

**Alternativa:** usar `new` dentro de cada service acoplaria a montagem dos objetos ao caso de uso. Criar uma interface `CatalogService` com uma única `CatalogServiceImpl` não traria benefício por si só.

**Exercício:** modele uma classe Java que receba um calculador pelo construtor; depois substitua o calculador em um teste.

### SOLID e responsabilidades

**Conceito:** princípios ajudam a manter código coeso, não exigem uma classe para cada método.

**Onde:** controller traduz HTTP; service coordena compra; entidade calcula ou preserva invariantes; repository conhece persistência. Isso aplica responsabilidade única a papéis reais.

**Por quê:** alterar um status HTTP não deveria obrigar a reescrever a regra de preço. A fronteira de persistência é uma abstração útil; nem toda classe precisa de interface.

**Alternativa:** um único controller com SQL, cálculo e serialização é inicialmente curto, mas mistura motivos de mudança.

**Exercício:** encontre uma responsabilidade de cada camada sem mover métodos apenas para aumentar o número de classes.

### Controllers, services e repositories

**Conceito:** controller recebe HTTP; service executa um caso de uso; repository consulta e grava.

**Onde:** [`ProductController`](../../src/main/java/com/ordersphere/catalog/ProductController.java) delega a [`CatalogService`](../../src/main/java/com/ordersphere/catalog/CatalogService.java), que usa `ProductRepository`.

**Por quê:** DTOs evitam mass assignment e vazamento de relacionamentos JPA. Bean Validation verifica formato; regras críticas continuam no domínio e no banco.

**Alternativa:** retornar a entidade diretamente acoplaria o contrato público à persistência.

**Exercício:** siga a criação de produto e anote onde nascem ID, SKU normalizado, preço e estoque inicial.

### JPA e transações

**Conceito:** JPA mapeia objetos para tabelas; uma transação confirma um conjunto de mudanças ou as desfaz.

**Onde:** `Product` usa `@Entity`; services delimitam operações com `@Transactional`. A criação de pedido consome todos os itens e persiste o pedido sob a mesma transação.

**Por quê:** se o segundo item falhar, o primeiro consumo deve ser revertido. Flyway define o schema; JPA valida sua compatibilidade. Não usamos `ddl-auto=create` como migração.

**Alternativa:** gravar cada consumo em uma transação independente deixaria estoque consumido sem pedido se uma etapa posterior falhasse.

**Exercício:** descreva o estado final de uma compra com dois itens quando só o primeiro tem estoque.

### Locking e concorrência

**Conceito:** duas requisições podem executar ao mesmo tempo. Fazer uma consulta correta isoladamente não garante uma compra correta sob concorrência.

**Onde:** [`InventoryRepository`](../../src/main/java/com/ordersphere/inventory/InventoryRepository.java) faz atualização condicional atômica; o cancelamento bloqueia a linha do pedido. Leia a [ADR 002](../architecture/decisions/002-inventory-concurrency-strategy.md).

**Por quê:** PostgreSQL avalia saldo suficiente na atualização. O lock do pedido impede duas reposições no cancelamento. Ordenar produtos reduz ciclos de lock.

**Alternativas:** optimistic locking com `@Version` ou pessimistic locking do estoque também são possíveis, com custos descritos na ADR.

**Exercício:** desenhe a linha do tempo de duas compras para uma unidade e indique em que ponto uma delas deve falhar.

### Testes

**Conceito:** testes unitários verificam regras isoladas; testes de integração verificam componentes reais trabalhando juntos.

**Onde:** [`src/test`](../../src/test) contém regras de domínio e cenários de API/PostgreSQL. Testcontainers fornece o banco real, inclusive para concorrência.

**Por quê:** um mock que devolve `true` não prova locks, constraints ou rollback do PostgreSQL. A suíte real deve afirmar quantidade de pedidos, resultados e saldo após duas chamadas simultâneas.

**Alternativa:** H2 simplifica a instalação, mas não substitui a semântica de concorrência do banco escolhido.

**Exercício:** escreva três asserts que diferenciem um teste concorrente de um teste que apenas chama a mesma função duas vezes sequencialmente.

## English

Start with the Java domain classes, then trace one request through controller, service and repository. The Portuguese sections above follow the same study pattern: concept, concrete code location, reason, alternative and exercise.

| Concept | Actual example | Reason and alternative | Exercise |
| --- | --- | --- | --- |
| Classes and encapsulation | `Product.update`, private fields | Centralize valid changes; public mutable fields scatter validation | Implement a plain Java stock balance |
| Records and enums | `ProductRequest`, `ProductView`, order status | Explicit data/state contracts; ordinary classes remain valid when behavior or mutability is required | Create a line record and a status enum |
| Decimal money | `BigDecimal`, `UNNECESSARY` scale | Exact BRL amounts; integer cents are another possible model | Calculate 3 × 19.90 and compare scales |
| Interfaces and composition | `ProductRepository`, constructor dependencies | Spring supplies persistence implementation; not every service needs an interface | Inject a calculator into a plain class |
| SOLID | HTTP, use case, entity and persistence roles | Cohesion by real responsibility; avoid a controller containing every concern | Trace a change to its responsible layer |
| Controllers/services/repositories | `ProductController` → `CatalogService` → `ProductRepository` | Stable DTO contracts; exposing entities couples API and storage | Trace product creation |
| JPA and transactions | `@Entity`, `@Transactional` | Atomic purchase; separate commits could leave partial consumption | Explain a two-item rollback |
| Locking and concurrency | Conditional inventory update, locked cancellation | Prevent overselling and double restoration; compare optimistic/pessimistic alternatives | Draw two simultaneous purchases |
| Testing | Domain tests and PostgreSQL/Testcontainers integration | A mock cannot prove real database semantics | State the assertions for one unit and two buyers |
