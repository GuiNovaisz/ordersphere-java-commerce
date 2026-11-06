# Capturas da interface / Interface screenshots

## Português

Capturas reais do Playwright contra Compose local descartável, com produtos/clientes sintéticos criados pela API. As ilustrações de produto são placeholders CSS por SKU; dados administrativos/pedidos são respostas reais desse ambiente de teste. Não há imagens de cartões, senhas ou dados pessoais reais.

| Experiência | Evidência versionada |
| --- | --- |
| Catálogo desktop claro | [catalog-desktop.png](catalog-desktop.png) |
| Catálogo mobile | [catalog-mobile.png](catalog-mobile.png) |
| Tema escuro | [catalog-dark-desktop.png](catalog-dark-desktop.png) |
| Login | [login-desktop.png](login-desktop.png) |
| Checkout mobile | [checkout-mobile.png](checkout-mobile.png) |
| Pedido e snapshots | [order-desktop.png](order-desktop.png) |
| Dashboard ADMIN | [admin-dashboard-desktop.png](admin-dashboard-desktop.png) |
| Produtos ADMIN mobile | [admin-products-mobile.png](admin-products-mobile.png) |
| Estoque ADMIN | [admin-inventory-desktop.png](admin-inventory-desktop.png) |

A suíte também captura produto, carrinho, cadastro, lista de pedidos, conta, criação/edição, inventário, estados vazio/erro e admin escuro. Quatro viewports:1440×1000,1280×800,768×1024,390×844. Apenas esta seleção é versionada para limitar ruído; as demais capturas são ignoradas localmente e publicadas como artefatos do job `e2e`. Regenerar altera UUIDs, datas e dados sintéticos; não são snapshots pixel-perfect nem métricas comerciais.

## English

These are real Playwright screenshots from a disposable local Compose environment, seeded through the actual API with synthetic products/customers. Product artwork is deterministic CSS, not product photography. No real personal data or passwords are included.

The table links the curated versioned gallery. The suite additionally captures product/cart/registration/orders/account/admin forms/inventory/empty/error/dark states across1440×1000,1280×800,768×1024 and390×844. Other captures are ignored locally and uploaded as CI `e2e` artifacts. UUIDs/timestamps/test records vary; these are visual evidence rather than pixel-perfect snapshots or commercial metrics.
