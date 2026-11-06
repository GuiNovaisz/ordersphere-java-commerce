# ADR 001 — Monólito modular / Modular monolith

## Português

**Estado:** aceito para a fundação backend.

**Contexto:** catálogo, estoque e pedidos precisam de uma operação de compra consistente, com execução e estudo locais acessíveis.

**Decisão:** uma aplicação Spring Boot, um PostgreSQL e pacotes por domínio. Controllers, services e repositories são separados por responsabilidade dentro de cada feature, sem diretórios vazios ou interfaces artificiais.

**Alternativas:** microsserviços exigiriam comunicação remota, deploys adicionais e consistência distribuída; uma organização global apenas por camada tornaria o fluxo de cada feature menos próximo.

**Consequências:** transações locais e debugging simples; todos os módulos compartilham implantação e banco. Limites são convenções de código, não isolamento físico. Crescimento futuro deve ser guiado por necessidades medidas.

## English

**Status:** accepted for the backend foundation.

Catalog, inventory and orders require a consistent purchase transaction and an approachable local development environment. We use one Spring Boot application, one PostgreSQL database and feature packages with cohesive internal responsibilities.

Microservices would add remote calls, multiple deployments and distributed consistency. A global package-per-layer structure would spread a feature across the codebase. The chosen design keeps local transactions and debugging straightforward, while sharing deployment and database resources. Package boundaries remain code conventions rather than physical isolation.
