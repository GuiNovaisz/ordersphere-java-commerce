package com.ordersphere.inventory;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "inventory")
public class Inventory {
    @Id private UUID productId;
    @Column(nullable = false) private long quantity;
    protected Inventory() {}
    public Inventory(UUID productId) { this.productId = productId; this.quantity = 0; }
    public UUID getProductId() { return productId; }
    public long getQuantity() { return quantity; }
}
