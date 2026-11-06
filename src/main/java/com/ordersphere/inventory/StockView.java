package com.ordersphere.inventory;

import java.util.UUID;

public record StockView(UUID productId, long quantity) {
    public static StockView from(Inventory stock) { return new StockView(stock.getProductId(), stock.getQuantity()); }
}
