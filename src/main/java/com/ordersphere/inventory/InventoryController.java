package com.ordersphere.inventory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/inventory")
public class InventoryController {
    private final StockService stock;
    public InventoryController(StockService stock) { this.stock = stock; }

    @GetMapping
    public Page<StockView> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return stock.list(page, size); }

    @GetMapping("/{productId}")
    public StockView get(@PathVariable UUID productId) { return stock.get(productId); }

    @PatchMapping("/{productId}")
    public StockView adjust(@PathVariable UUID productId, @Valid @RequestBody Adjustment request) { return stock.adjust(productId, request.delta()); }

    public record Adjustment(@NotNull @Min(-1000000000) @Max(1000000000) Long delta) {}
}
