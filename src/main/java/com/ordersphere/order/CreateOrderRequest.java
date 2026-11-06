package com.ordersphere.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

public record CreateOrderRequest(@NotEmpty @Size(max = 50) List<@NotNull @Valid Item> items) {
    public CreateOrderRequest {
        if (items != null) items = List.copyOf(items);
    }
    public record Item(@NotNull UUID productId, @Min(1) @Max(1000000) int quantity) {}
}
