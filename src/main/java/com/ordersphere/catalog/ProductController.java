package com.ordersphere.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ProductController {
    private final CatalogService catalog;
    public ProductController(CatalogService catalog) { this.catalog = catalog; }

    @GetMapping("/products")
    public Page<ProductView> list(@RequestParam(required = false) String name, @RequestParam(required = false) String sku,
                                  @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
                                  @RequestParam(defaultValue = "name,asc") String sort) {
        return catalog.list(name, sku, true, page, size, sort);
    }

    @GetMapping("/products/{id}")
    public ProductView get(@PathVariable UUID id) { return catalog.get(id, true); }

    @GetMapping("/admin/products")
    public Page<ProductView> adminList(@RequestParam(required = false) String name, @RequestParam(required = false) String sku,
                                       @RequestParam(required = false) Boolean active,
                                       @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size,
                                       @RequestParam(defaultValue = "name,asc") String sort) {
        return catalog.list(name, sku, active, page, size, sort);
    }

    @GetMapping("/admin/products/{id}")
    public ProductView adminGet(@PathVariable UUID id) { return catalog.get(id, false); }

    @PostMapping("/admin/products")
    public ResponseEntity<ProductView> create(@Valid @RequestBody ProductRequest request) {
        ProductView product = catalog.create(request);
        return ResponseEntity.created(URI.create("/api/v1/products/" + product.id())).body(product);
    }

    @PutMapping("/admin/products/{id}")
    public ProductView update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) { return catalog.update(id, request); }

    @PatchMapping("/admin/products/{id}/status")
    public ProductView status(@PathVariable UUID id, @Valid @RequestBody StatusRequest request) { return catalog.status(id, request.active()); }

    public record StatusRequest(@NotNull Boolean active) {}
}
