# ADR 004 — Sessão e CSRF / Session authentication and CSRF

## Português

**Estado:** aceito para uma aplicação backend única.

**Decisão:** Spring Security com sessão de servidor e cookie de sessão HttpOnly. O login estabelece o contexto autenticado; logout invalida a sessão. A identidade chega aos controllers por `@AuthenticationPrincipal AuthenticatedUser`, sem parsing manual de credenciais. Senhas usam o password encoder do Spring Security.

Requisições que alteram estado exigem token CSRF. O cliente obtém token e nome do header em `GET /api/v1/auth/csrf`, preserva o cookie e envia o header. Deve obter um novo token após login/logout. Em HTTPS, configurar `SESSION_COOKIE_SECURE=true`; o ambiente HTTP local precisa permitir o cookie sem Secure.

**Alternativa:** JWT é útil quando há necessidade real de tokens independentes, mas logout imediato exigiria uma estratégia adicional de invalidação ou expiração curta. Não há necessidade de refresh tokens nesta fundação.

**Autorização:** cadastro sempre produz `CUSTOMER`; campos administrativos não são aceitos. Rotas administrativas exigem `ADMIN`. Consultas de pedido restringem proprietário e identificador. Recurso alheio é tratado como não encontrado. CORS não deve ser aberto indiscriminadamente para um frontend futuro.

**Consequências:** logout e invalidação simples, sem secret de assinatura JWT. Sessões em memória se perdem ao reiniciar e não servem para múltiplas réplicas sem armazenamento compartilhado. Um futuro frontend deve planejar cookies, origem e CSRF junto ao deploy.

## English

**Status:** accepted for one backend application.

Spring Security manages server-side sessions and an HttpOnly session cookie. Login establishes the security context; logout invalidates the session. Controllers receive `AuthenticatedUser` through `@AuthenticationPrincipal`. Password hashing uses Spring Security's password encoder.

State-changing requests require CSRF protection. Clients fetch the token and header name from `GET /api/v1/auth/csrf`, retain the cookie and send the header. Fetch a fresh token after login/logout. Set `SESSION_COOKIE_SECURE=true` under HTTPS; local HTTP requires a non-Secure cookie.

JWT would add a separate logout/revocation tradeoff without a current requirement for independent bearer tokens. Registration always assigns `CUSTOMER`; administrative routes require `ADMIN`; order access is scoped to owner and identifier. Other users' resources appear absent.

In-memory sessions are lost on restart and do not support multiple replicas without shared storage. A future frontend must configure its origin, cookie policy and CSRF flow deliberately.
