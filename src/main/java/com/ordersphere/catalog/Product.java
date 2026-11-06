package com.ordersphere.catalog;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {
    @Id private UUID id;
    @Column(nullable = false, length = 160) private String name;
    @Column(nullable = false, length = 2000) private String description;
    @Column(nullable = false, unique = true, length = 64) private String sku;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal price;
    @Column(nullable = false) private boolean active;
    @Column(nullable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;

    protected Product() {}

    public Product(String name, String description, String sku, BigDecimal price, boolean active) {
        this.id = UUID.randomUUID();
        this.createdAt = Instant.now();
        update(name, description, sku, price, active);
    }

    public void update(String name, String description, String sku, BigDecimal price, boolean active) {
        if (name == null || name.isBlank() || name.trim().length() > 160) throw new IllegalArgumentException("Invalid product name");
        if (description == null || description.length() > 2000) throw new IllegalArgumentException("Invalid description");
        String normalizedSku = sku == null ? "" : sku.trim().toUpperCase(Locale.ROOT);
        if (!normalizedSku.matches("[A-Z0-9][A-Z0-9_-]{0,63}")) throw new IllegalArgumentException("Invalid SKU");
        if (price == null || price.signum() < 0 || price.compareTo(new BigDecimal("999999999.99")) > 0) throw new IllegalArgumentException("Invalid price");
        this.name = name.trim();
        this.description = description;
        this.sku = normalizedSku;
        this.price = price.setScale(2, RoundingMode.UNNECESSARY);
        this.active = active;
        this.updatedAt = Instant.now();
    }

    public void setActive(boolean active) { this.active = active; this.updatedAt = Instant.now(); }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getSku() { return sku; }
    public BigDecimal getPrice() { return price; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
