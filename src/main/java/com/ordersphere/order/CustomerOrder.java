package com.ordersphere.order;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {
    @Id private UUID id;
    @Column(nullable = false) private UUID userId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private OrderStatus status;
    @Column(nullable = false, precision = 19, scale = 2) private BigDecimal total;
    @Column(nullable = false, length = 3) private String currency;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "order_id", nullable = false)
    @OrderColumn(name = "position")
    private List<OrderItem> items = new ArrayList<>();
    @Column(nullable = false) private Instant createdAt;
    private Instant cancelledAt;

    protected CustomerOrder() {}

    public CustomerOrder(UUID userId, List<OrderItem> items) {
        if (userId == null || items == null || items.isEmpty() || items.size() > 50 || items.stream().anyMatch(Objects::isNull))
            throw new IllegalArgumentException("An order requires an owner and 1 to 50 items");
        if (items.stream().map(OrderItem::getProductId).distinct().count() != items.size())
            throw new IllegalArgumentException("Duplicate product in order");
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.items = new ArrayList<>(items);
        this.total = items.stream().map(OrderItem::getSubtotal).reduce(new BigDecimal("0.00"), BigDecimal::add);
        this.currency = "BRL";
        this.status = OrderStatus.CONFIRMED;
        this.createdAt = Instant.now();
    }

    /** Returns true only for the first cancellation, which must restore stock in the same transaction. */
    public boolean cancel() {
        if (status == OrderStatus.CANCELLED) return false;
        if (status != OrderStatus.CONFIRMED) throw new IllegalStateException("Order cannot be cancelled");
        status = OrderStatus.CANCELLED;
        cancelledAt = Instant.now();
        return true;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public OrderStatus getStatus() { return status; }
    public BigDecimal getTotal() { return total; }
    public String getCurrency() { return currency; }
    public List<OrderItem> getItems() { return Collections.unmodifiableList(items); }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCancelledAt() { return cancelledAt; }
}
