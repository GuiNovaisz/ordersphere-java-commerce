package com.ordersphere.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductView(UUID id, String name, String description, String sku, BigDecimal price,
                          boolean active, Instant createdAt, Instant updatedAt) {
    public static ProductView from(Product product) {
        return new ProductView(product.getId(), product.getName(), product.getDescription(), product.getSku(),
                product.getPrice(), product.isActive(), product.getCreatedAt(), product.getUpdatedAt());
    }
}
