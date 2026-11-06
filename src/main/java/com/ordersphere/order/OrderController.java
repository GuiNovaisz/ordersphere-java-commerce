package com.ordersphere.order;

import com.ordersphere.shared.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orders;
    public OrderController(OrderService orders) { this.orders = orders; }

    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ResponseEntity<OrderView> create(@AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody CreateOrderRequest request) {
        OrderView order = orders.create(user.id(), request);
        return ResponseEntity.created(URI.create("/api/v1/orders/" + order.id())).body(order);
    }

    @GetMapping
    public Page<OrderView> list(@AuthenticationPrincipal AuthenticatedUser user,
                               @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return orders.list(user.id(), page, size);
    }

    @GetMapping("/{id}")
    public OrderView get(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) { return orders.get(user.id(), id); }

    @PostMapping("/{id}/cancel")
    public OrderView cancel(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) { return orders.cancel(user.id(), id); }
}
