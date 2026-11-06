# ADR 003 — Snapshot do pedido / Order snapshot

## Português

**Estado:** aceito.

**Contexto:** alterações no catálogo não devem reescrever o significado de uma compra concluída.

**Decisão:** `OrderItem` guarda `productId`, SKU, nome, preço unitário, quantidade e subtotal do momento da compra. O preço é definido pelo servidor; a request contém apenas produto e quantidade. O total é a soma dos subtotais. Os valores usam `BigDecimal` e escala de duas casas em BRL; não há conversão de moedas.

**Alternativa rejeitada:** consultar o preço atual do produto ao renderizar pedidos. Isso transformaria uma compra de R$ 100 em R$ 120 após uma mudança de catálogo.

**Consequências:** duplicação intencional de poucos dados comerciais e histórico estável. O catálogo continua sendo a fonte para novas compras. A referência ao produto permite rastreabilidade e devolução de estoque, mas não determina o preço histórico.

## English

**Status:** accepted.

An `OrderItem` stores the product identifier, SKU, name, unit price, quantity and subtotal at purchase time. The server chooses the price; clients send product identifiers and quantities only. Totals are computed with `BigDecimal`, two decimal places and BRL.

Using the current catalog price to display an old order would change a historical purchase after a catalog update. The small, deliberate duplication preserves the commercial record. Product references support traceability and inventory restoration while current catalog values apply only to new purchases.
