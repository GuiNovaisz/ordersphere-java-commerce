# ADR 006 — Mesma origem e reverse proxy / Same-origin reverse proxy

Status: aceita na feature v0.2.0 / accepted on the v0.2.0 feature.

## Português

**Contexto:** Spring usa sessão HttpOnly e CSRF, inclusive no login. Servir UI e API em origens diferentes exigiria configuração CORS/credentials/cookies adicional sem benefício neste escopo.

**Decisão:** Nginx non-root serve o build Vite e encaminha `/api/` ao Spring interno, preservando URI e cookies. Também encaminha health/OpenAPI/Swagger existentes. Só web publica porta em loopback; PostgreSQL e API permanecem na rede Compose. Vite usa proxy `/api` para desenvolvimento. Nginx aplica CSP, nosniff, referrer policy e fallback SPA; assets com hash têm cache longo, index requer revalidação.

**Consequências:** mesma origem simplifica cookie e CSRF, mas não elimina CSRF. Token continua obrigatório em toda mutação. Não adicionamos CORS amplo nem JWT. Local HTTP usa cookie Secure desabilitado; publicação HTTPS futura precisa de terminação TLS, revisão de forwarding/origem e `SESSION_COOKIE_SECURE=true`. A configuração local não representa deploy público. O proxy de Swagger mantém a ferramenta existente; endurecimento de produção é trabalho específico de operação futura.

**Alternativas:** servir o build pelo Spring poderia manter mesma origem, mas acoplaria ciclos de build e assets ao JAR. Hosts separados criariam configuração e modos de falha extras. A escolha mantém Java como único backend e Node apenas como ferramenta.

## English

Nginx non-root serves the built SPA and forwards API requests/cookies to internal Spring. Only web publishes a loopback port; API/PostgreSQL remain internal. Vite provides the development `/api` proxy. CSP/security headers, SPA fallback and separate index/hashed-asset caching are configured centrally.

Same-origin avoids unnecessary cross-origin cookie/CORS complexity; it does not remove CSRF protection. Every mutation still needs the server-provided token header. No JWT or permissive CORS is added. Local HTTP disables Secure cookies; a future HTTPS deployment must explicitly configure TLS, forwarding/origin trust and Secure cookies. This is not a public deployment. Serving assets from Spring was possible but would couple release/build cycles; separate origins add configuration without a requirement here.
