package com.ordersphere.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderView(UUID id, OrderStatus status, BigDecimal total, String currency, List<Item> items,
                        Instant createdAt, Instant cancelledAt) {
    public OrderView { items = List.copyOf(items); }
    public static OrderView from(CustomerOrder order) {
        return new OrderView(order.getId(), order.getStatus(), order.getTotal(), order.getCurrency(),
                order.getItems().stream().map(item -> new Item(item.getProductId(), item.getSku(), item.getProductName(),
                        item.getUnitPrice(), item.getQuantity(), item.getSubtotal())).toList(), order.getCreatedAt(), order.getCancelledAt());
    }
    public record Item(UUID productId, String sku, String productName, BigDecimal unitPrice, int quantity, BigDecimal subtotal) {}
}
