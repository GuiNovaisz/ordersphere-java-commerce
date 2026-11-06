package com.ordersphere.catalog;

import com.ordersphere.inventory.Inventory;
import com.ordersphere.inventory.InventoryRepository;
import com.ordersphere.shared.exception.ApiException;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final ProductRepository products;
    private final InventoryRepository inventory;

    public CatalogService(ProductRepository products, InventoryRepository inventory) {
        this.products = products;
        this.inventory = inventory;
    }

    public Product require(UUID id, boolean activeOnly) {
        Product product = products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        if (activeOnly && !product.isActive()) throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        return product;
    }

    public ProductView get(UUID id, boolean activeOnly) { return ProductView.from(require(id, activeOnly)); }

    public Page<ProductView> list(String name, String sku, Boolean active, int page, int size, String sort) {
        Pageable pageable = pageRequest(page, size, sort);
        Specification<Product> criteria = (root, query, cb) -> cb.conjunction();
        if (name != null && !name.isBlank()) {
            String pattern = "%" + escapeLike(name.trim().toLowerCase(Locale.ROOT)) + "%";
            criteria = criteria.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern, '\\'));
        }
        if (sku != null && !sku.isBlank()) {
            String value = sku.trim().toUpperCase(Locale.ROOT);
            criteria = criteria.and((root, query, cb) -> cb.equal(root.get("sku"), value));
        }
        if (active != null) criteria = criteria.and((root, query, cb) -> cb.equal(root.get("active"), active));
        return products.findAll(criteria, pageable).map(ProductView::from);
    }

    public static Pageable pageRequest(int page, int size, String sort) {
        if (page < 0 || size < 1 || size > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "Page must be non-negative and size between 1 and 100");
        String[] parts = sort.split(",", -1);
        if (parts.length > 2 || !Set.of("name", "sku", "price", "createdAt", "id").contains(parts[0]))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported sort property");
        String direction = parts.length == 2 ? parts[1].toLowerCase(Locale.ROOT) : "asc";
        if (!Set.of("asc", "desc").contains(direction)) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid sort direction");
        return PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), parts[0]).and(Sort.by("id")));
    }

    private static String escapeLike(String value) { return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_"); }

    @Transactional
    public ProductView create(ProductRequest request) {
        Product product = products.saveAndFlush(new Product(request.name(), request.description(), request.sku(), request.price(), request.active()));
        inventory.save(new Inventory(product.getId()));
        return ProductView.from(product);
    }

    @Transactional
    public ProductView update(UUID id, ProductRequest request) {
        Product product = require(id, false);
        product.update(request.name(), request.description(), request.sku(), request.price(), request.active());
        products.flush();
        return ProductView.from(product);
    }

    @Transactional
    public ProductView status(UUID id, boolean active) {
        Product product = require(id, false);
        product.setActive(active);
        return ProductView.from(product);
    }
}
