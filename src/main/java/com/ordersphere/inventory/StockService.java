package com.ordersphere.inventory;

import com.ordersphere.shared.exception.ApiException;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class StockService {
    private final InventoryRepository inventory;
    public StockService(InventoryRepository inventory) { this.inventory = inventory; }

    public StockView get(UUID productId) {
        return new StockView(productId, inventory.quantity(productId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Inventory not found")));
    }

    public Page<StockView> list(int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid pagination");
        return inventory.findAll(PageRequest.of(page, size, Sort.by("productId"))).map(StockView::from);
    }

    @Transactional
    public StockView adjust(UUID productId, long delta) {
        if (delta == 0 || delta < -1000000000L || delta > 1000000000L)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Delta must be non-zero and between -1000000000 and 1000000000");
        if (inventory.adjust(productId, delta) == 0) {
            if (!inventory.existsById(productId)) throw new ApiException(HttpStatus.NOT_FOUND, "Inventory not found");
            throw new ApiException(HttpStatus.CONFLICT, "Stock adjustment would exceed allowed bounds");
        }
        // Bulk updates bypass the persistence context. Read quantity directly after the update.
        return get(productId);
    }

    @Transactional
    public void consume(UUID productId, int quantity) {
        if (quantity < 1 || quantity > 1000000) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid purchase quantity");
        if (inventory.consume(productId, quantity) != 1) throw new ApiException(HttpStatus.CONFLICT, "Insufficient stock");
    }

    @Transactional
    public void restore(UUID productId, int quantity) {
        if (quantity < 1 || quantity > 1000000) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid restore quantity");
        if (inventory.adjust(productId, quantity) != 1) throw new ApiException(HttpStatus.CONFLICT, "Stock capacity exceeded; cancellation rolled back");
    }
}
