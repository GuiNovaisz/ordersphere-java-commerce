package com.ordersphere.order;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id private UUID id;
    @Column(nullable = false) private UUID productId;
    @Column(nullable = false, length = 64) private String sku;
    @Column(nullable = false, length = 160) private String productName;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal unitPrice;
    @Column(nullable = false) private int quantity;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal subtotal;

    protected OrderItem() {}

    public OrderItem(UUID productId, String sku, String productName, BigDecimal unitPrice, int quantity) {
        if (productId == null || sku == null || sku.isBlank() || productName == null || productName.isBlank())
            throw new IllegalArgumentException("Invalid product snapshot");
        if (unitPrice == null || unitPrice.signum() < 0 || unitPrice.compareTo(new BigDecimal("999999999.99")) > 0)
            throw new IllegalArgumentException("Invalid unit price");
        if (quantity < 1 || quantity > 1000000) throw new IllegalArgumentException("Invalid item quantity");
        this.id = UUID.randomUUID();
        this.productId = productId;
        this.sku = sku;
        this.productName = productName;
        this.unitPrice = unitPrice.setScale(2, RoundingMode.UNNECESSARY);
        this.quantity = quantity;
        this.subtotal = this.unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public UUID getProductId() { return productId; }
    public String getSku() { return sku; }
    public String getProductName() { return productName; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public int getQuantity() { return quantity; }
    public BigDecimal getSubtotal() { return subtotal; }
}
