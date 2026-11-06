# API / API guide

## Português

No Swagger UI, execute `GET /api/v1/auth/csrf` e copie o `token` retornado para o parâmetro `X-CSRF-TOKEN` das mutações. Os cookies são mantidos pelo navegador na mesma origem. Depois de login/logout, obtenha e copie um token novo. Operações públicas são identificadas sem requisito de sessão no OpenAPI.

Base local: `http://localhost:8080/api/v1`. OpenAPI gerado pelo código: `/v3/api-docs`. Interface: `/swagger-ui/index.html`. A especificação é a referência estrutural; os exemplos abaixo explicam sessão, CSRF e regras de negócio.

### Sessão e CSRF no PowerShell

O exemplo usa `WebRequestSession`, sem copiar credenciais reais para o repositório. Substitua os valores localmente. O cadastro retorna perfil, mas não autentica automaticamente.

```powershell
$base = 'http://localhost:8080/api/v1'
$web = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$csrf = Invoke-RestMethod "$base/auth/csrf" -WebSession $web
$headers = @{ $csrf.headerName = $csrf.token }
$credentials = @{ email = 'customer@example.com'; password = 'use-a-local-strong-password' } | ConvertTo-Json
Invoke-RestMethod "$base/auth/register" -Method Post -WebSession $web -Headers $headers -ContentType 'application/json' -Body $credentials
Invoke-RestMethod "$base/auth/login" -Method Post -WebSession $web -Headers $headers -ContentType 'application/json' -Body $credentials
# Login rotaciona a sessão/token: obtenha um novo token.
$csrf = Invoke-RestMethod "$base/auth/csrf" -WebSession $web
$headers = @{ $csrf.headerName = $csrf.token }
Invoke-RestMethod "$base/auth/me" -WebSession $web
```

Para administrar, faça login em outra sessão com a conta ADMIN configurada no bootstrap. Preserve sessões distintas para não confundir papéis.

### Catálogo e estoque

Entrada de criação e atualização completa de produto:

```json
{
  "name": "Java Notebook",
  "description": "Notebook para estudos",
  "sku": "NOTEBOOK-JAVA",
  "price": 100.00,
  "active": true
}
```

ADMIN: `POST /admin/products` retorna 201 e `Location`; `PUT /admin/products/{id}` retorna 200. Ativação: `PATCH /admin/products/{id}/status` com `{"active":false}`. Ajuste de estoque: `PATCH /admin/inventory/{productId}` com `{"delta":10}`; delta negativo remove saldo, sem permitir negativo. Produto recém-criado começa com estoque zero.

Catálogo público: `GET /products?name=notebook&page=0&size=20&sort=price,asc`. O filtro `sku` usa igualdade após normalização; `name` busca trecho, tratando `%` e `_` como texto, não curingas externos. `/admin/products?active=false` inclui produtos inativos mediante ADMIN.

Todas as listagens usam `page` zero-based e `size` entre 1 e 100. A resposta paginada expõe `content` e metadados em `page` (`size`, `number`, `totalElements`, `totalPages`).

### Compra e cancelamento

Não envie usuário, papel, preço ou total. A identidade vem da sessão e os valores vêm do catálogo.

```powershell
$productId = 'SUBSTITUA-PELO-UUID-DO-PRODUTO'
$body = @{ items = @(@{ productId = $productId; quantity = 1 }) } | ConvertTo-Json -Depth 4
$order = Invoke-RestMethod "$base/orders" -Method Post -WebSession $web -Headers $headers -ContentType 'application/json' -Body $body
Invoke-RestMethod "$base/orders/$($order.id)" -WebSession $web
Invoke-RestMethod "$base/orders/$($order.id)/cancel" -Method Post -WebSession $web -Headers $headers
# Repetir cancelamento não repõe estoque novamente.
Invoke-RestMethod "$base/orders/$($order.id)/cancel" -Method Post -WebSession $web -Headers $headers
Invoke-RestMethod "$base/auth/logout" -Method Post -WebSession $web -Headers $headers
```

A compra retorna 201 e snapshot `OrderView` com `id`, `status`, `total`, `currency`, `items`, `createdAt` e `cancelledAt`. Pedidos são confirmados ao concluir a transação. Cancelamento retorna a representação cancelada, com reposição exatamente uma vez. Recurso inexistente ou de outro dono retorna 404.

Criar pedido não aceita `Idempotency-Key` nesta versão. Repetir um POST após timeout pode criar outra compra; consulte o estado antes de tentar novamente. Não há estado de reserva ou pagamento real.

### Erros

| Status | Exemplo |
| --- | --- |
| 400 | Payload inválido, campo desconhecido, paginação/ordenação inválida |
| 401 | Ausência de sessão ou credenciais incorretas |
| 403 | CUSTOMER em rota ADMIN; token CSRF ausente/inválido |
| 404 | Produto indisponível, pedido inexistente/alheio |
| 409 | SKU/e-mail duplicado, estoque insuficiente, ajuste/lock conflitante |
| 500 | Falha inesperada, com mensagem genérica |

Erros usam `application/problem+json`, status e detalhe apropriados. Não incluem senha, token, stack trace ou SQL interno. Uma requisição sem sessão e sem CSRF pode ser rejeitada pelo filtro CSRF com 403 antes de chegar à autenticação; para testar 401 isoladamente use GET protegido ou token CSRF válido.

## English

In Swagger UI, call `GET /api/v1/auth/csrf` and copy its token into each mutation's `X-CSRF-TOKEN` parameter. The browser retains same-origin cookies. Fetch and copy a new token after login/logout. Public operations have no session requirement in the OpenAPI contract.

Local base: `http://localhost:8080/api/v1`. Generated OpenAPI: `/v3/api-docs`; Swagger UI: `/swagger-ui/index.html`.

Use the PowerShell examples above to keep a cookie session, fetch the CSRF token/header name, register, log in and fetch a fresh token. Registration returns a profile without automatically logging in. State-changing requests require the returned header. Log in with a separate ADMIN session for catalog and inventory management.

Product creation/update accepts `name`, `description`, `sku`, decimal `price` and `active`. `POST /admin/products` returns 201 with `Location`; `PUT /admin/products/{id}` returns 200. Activation uses `PATCH /admin/products/{id}/status` with `{"active":false}`. Inventory adjustment uses `PATCH /admin/inventory/{productId}` with a signed nonzero `delta`; a product starts with zero inventory.

Public catalog queries support partial literal `name`, exact normalized `sku`, zero-based `page`, `size` 1–100 and allowlisted sort fields. ADMIN may filter by `active`. Paged responses contain `content` and `page` metadata (`size`, `number`, `totalElements`, `totalPages`).

Order requests contain only `items` with `productId` and `quantity`. Identity comes from the session and prices come from the server. Creation returns 201 and a snapshot with identifier, status, total, currency, items and timestamps. Own-order cancellation returns the cancelled representation and restores inventory exactly once. Missing or foreign orders return 404.

Order creation has no idempotency key. Repeating POST after a timeout can create a separate purchase. There are no temporary reservations or real payments.

Problem Details errors distinguish invalid input (400), missing/invalid authentication (401), authorization/CSRF rejection (403), absent resources (404), business/integrity/concurrency conflicts (409) and unexpected failures (500). CSRF can reject an unauthenticated mutation before authentication runs. Responses do not expose credentials, stack traces or SQL internals.
