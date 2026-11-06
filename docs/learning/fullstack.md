# Aprendizado Full Stack / Full-stack learning

## Português

Leia [arquitetura](../architecture/frontend.md) e siga uma compra pelo código. O objetivo é relacionar decisões à sua consequência observável, não memorizar nomes de bibliotecas.

| Conceito | Onde observar | Por que existe / exercício |
| --- | --- | --- |
| SPA e roteamento | `frontend/src/App.tsx`, `frontend/nginx.conf` | Navegação mantém a aplicação e consulta dados; refresh de `/pedidos/:id` precisa do fallback SPA. Compare navegação e recarga na aba Network. |
| Componentes e props | `components/ui.tsx`, catálogo | `ProductArt` recebe dados e gera placeholder; `Pagination` recebe estado e callback. Diferencie função de render e efeito externo. |
| Hooks | `app/state.tsx`, `features/admin/Admin.tsx` | Hooks rodam na mesma ordem no topo do componente; efeitos sincronizam storage/DOM, não calculam todo estado derivado. Explique por que não buscar API em cada render. |
| TypeScript strict | `types/api.ts`, `tsconfig*.json` | Tipos detectam combinações inválidas no build; Zod verifica JSON que o compilador não controla. Altere uma resposta de teste e observe validação runtime. |
| Estado remoto vs local | Query em produtos/pedidos, Context no carrinho | Saldo pertence ao servidor; carrinho é intenção local. Invalidação refaz a consulta após mutações; não somamos manualmente métricas globais. |
| Cache e queries | chaves `products`, `admin-products`, `inventory`, `orders`, `identity` | Filtros/página fazem parte da chave. Reutilizar identidade entre contas vazaria estado; remover a query observada inteira pode quebrar atualização da UI. |
| Forms e validação | AuthPage, ProductEditor | RHF gerencia campos e Zod dá feedback. Validar preço no browser não elimina validação do DTO. Experimente senha com caracteres multibyte acima de72bytes. |
| Sessão | `lib/api.ts`, `AuthProvider` | Cookie HttpOnly é enviado pelo browser; Java responde `/auth/me`. HttpOnly impede leitura via JavaScript, não dispensa proteção contra XSS/CSRF. |
| CSRF | `refreshCsrf`, `request`, login/logout | Obter token e usar o header retornado demonstra intenção de mesma origem. Login renova a sessão/token; um header antigo pode falhar. Nenhum POST é reproduzido automaticamente. |
| RBAC e ownership | Guard + Spring Security + consulta de pedido | Guard evita tela inadequada; API precisa negar chamada direta. CUSTOMER não vira ADMIN ao editar storage, e conhecer UUID de outro pedido não concede acesso. |
| Same-origin | Vite proxy e Nginx | Browser fala com uma origem; proxy fala com Spring. A política de origem trata esquema/host/porta, não paths. localhost5173 e localhost8080 seriam origens diferentes sem proxy. |
| Reverse proxy | `frontend/nginx.conf` | Encaminha `/api` e serve arquivos; não implementa regra de pedido. Compare endpoint pela origem web e resolução interna do serviço `api`. |
| Docker multi-container | `compose.yml` | `web` aguarda API saudável, que aguarda banco; volume guarda dados. Container/rede/volume têm ciclos diferentes. `down` preserva dados; `down -v` remove volume do projeto. |
| Consistência e UX | CartPage, OrderService, InventoryRepository | UI não reserva nem decide preço. POST manda IDs/quantidades; SQL condicional + transação impede overselling. HTTP409 preserva intenção local para revisão. |
| Testes por camada | Vitest, Testing Library, Playwright, Maven | Teste de carrinho não prova lock. E2E real e BackendIT provam colaboração com PostgreSQL; axe não prova toda acessibilidade. |

### Trilha prática

1. Leia `features/cart/model.ts`: encontre a soma de centavos, validação do storage e transformação para payload. Mostre por que um preço adulterado não controla o pedido.
2. Siga `CartPage.submit` → `api.createOrder` → controller/service Java → `UPDATE` de saldo → snapshot. Descreva rollback se o segundo item falhar.
3. Abra login no browser isolado. Observe GET csrf, POST login, cookie e novo GET csrf. Não copie valores sensíveis para documentação.
4. Compare catálogo público e consulta administrativa; explique por que um UUID e o papel da conta importam mais do que um link escondido.
5. Leia o E2E de dois compradores. Explique o que cada assert prova:201/409, saldo0, total de pedidos1 e carrinho preservado.
6. Simule rede interrompida depois de enviar um pedido. Diferencie falha HTTP confirmada de resultado desconhecido. Proponha, sem implementar agora, um contrato idempotente.
7. No mobile, use teclado para navegação/form/dialog. A preferência de tema deve persistir; nenhum dado de autenticação deve aparecer em local/sessionStorage.

## English

Follow an order through React → central API client → Spring → transactional PostgreSQL rather than memorizing libraries. The table above maps SPA routing, components/props/hooks, strict typing/runtime Zod validation, server/client/form state, Query cache keys/invalidation, session/CSRF, RBAC/ownership, same-origin proxying, Compose volumes and layered testing to actual files.

Key lessons: TypeScript cannot validate arbitrary network JSON; UI guards cannot authorize API requests; HttpOnly does not replace CSRF/XSS protections; a client cart expresses intent but never owns authoritative prices or inventory. Node builds/tests the SPA, while Nginx proxies requests and Java implements business rules. Same-origin avoids cross-origin configuration, not CSRF requirements.

Exercises: trace cart cents and payload stripping; explain rollback after a later item fails; inspect login/token rotation without copying secrets; compare public/admin queries and own/foreign orders; explain each concurrency assertion (201/409, zero stock, one stored order, retained loser cart); distinguish an HTTP error from an uncertain network outcome; navigate forms/dialogs by keyboard and inspect storage. Unit tests do not prove locks, and axe does not certify all accessibility.
