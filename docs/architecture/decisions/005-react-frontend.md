# ADR 005 — React SPA com estado explícito / React SPA with explicit state

Status: aceita na feature v0.2.0 / accepted on the v0.2.0 feature.

## Português

**Contexto:** a API Java está publicada, com sessão, CSRF, catálogo/estoque/pedidos e paginação. Precisamos demonstrar esses contratos por uma UI sem criar outro backend ou reescrever domínio.

**Decisão:** React + TypeScript strict + Vite como SPA. React Router separa rotas públicas/autenticadas/ADMIN; TanStack Query gerencia estado remoto e invalidação. Context é suficiente para carrinho/feedback; RHF + Zod para formulários e contratos runtime. CSS próprio com tokens e Lucide evita framework visual pesado e permite identidade consistente; dialog nativo fornece foco/modalidade. Rotas grandes são carregadas sob demanda.

**Alternativas:** SSR/Next adicionaria runtime e fronteira sem necessidade de SEO nesta demonstração. Redux duplicaria o estado remoto já tratado por Query. Uma biblioteca completa de componentes reduziria trabalho inicial, porém traria convenções e peso que não são necessários ao conjunto atual; componentes compartilhados permanecem pequenos.

**Consequências:** Java preserva autoridade. Navegação SPA exige fallback no proxy. Forms e schemas precisam acompanhar DTOs; não substituem validação do servidor. Carrinho local facilita navegação anônima, mas não sincroniza dispositivos nem reserva estoque. Acessibilidade exige revisão contínua; axe e testes de teclado não são certificação completa. O override transitivo de minimatch 11.0.5 corrige o advisory [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249); lint/build foram verificados. Remover quando a árvore upstream incorporar uma versão corrigida compatível.

## English

**Context:** an existing Java API already owns session/CSRF, catalog, inventory and orders. The UI must demonstrate its guarantees without another backend.

**Decision:** strict React/TypeScript SPA built by Vite, Router for navigation, TanStack Query for remote state, context for cart/feedback, RHF/Zod for forms/runtime contracts. Custom CSS tokens and Lucide provide a consistent identity without a large UI framework; native dialog supplies modality/focus. Large routes use lazy imports.

**Alternatives/consequences:** SSR would add an unnecessary runtime; Redux would duplicate remote state responsibilities. A full UI kit was not required for the limited component set. SPA routing requires proxy fallback; schemas must track DTOs. Local cart does not synchronize devices or reserve inventory. Automated accessibility is not certification. A tested minimatch11.0.5 override addresses the linked advisory and should be removed when the upstream dependency tree safely incorporates the fix.
