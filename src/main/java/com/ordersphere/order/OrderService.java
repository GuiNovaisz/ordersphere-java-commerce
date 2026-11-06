package com.ordersphere.order;

import com.ordersphere.catalog.CatalogService;
import com.ordersphere.catalog.Product;
import com.ordersphere.inventory.StockService;
import com.ordersphere.shared.exception.ApiException;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class OrderService {
    private final OrderRepository orders;
    private final CatalogService catalog;
    private final StockService stock;

    public OrderService(OrderRepository orders, CatalogService catalog, StockService stock) {
        this.orders = orders;
        this.catalog = catalog;
        this.stock = stock;
    }

    @Transactional
    public OrderView create(UUID userId, CreateOrderRequest request) {
        if (userId == null || request == null || request.items() == null || request.items().isEmpty() || request.items().size() > 50)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Order must contain 1 to 50 items");
        Set<UUID> productIds = new HashSet<>();
        for (CreateOrderRequest.Item item : request.items()) {
            if (item == null || item.productId() == null || item.quantity() < 1 || item.quantity() > 1000000)
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid order item");
            if (!productIds.add(item.productId())) throw new ApiException(HttpStatus.BAD_REQUEST, "Duplicate product in order");
        }
        // Consistent ordering of row updates prevents cycles between multi-product purchases/cancellations.
        List<CreateOrderRequest.Item> sorted = request.items().stream().sorted(Comparator.comparing(CreateOrderRequest.Item::productId)).toList();
        List<OrderItem> snapshots = new ArrayList<>();
        for (CreateOrderRequest.Item item : sorted) {
            Product product = catalog.require(item.productId(), true);
            stock.consume(product.getId(), item.quantity());
            snapshots.add(new OrderItem(product.getId(), product.getSku(), product.getName(), product.getPrice(), item.quantity()));
        }
        return OrderView.from(orders.saveAndFlush(new CustomerOrder(userId, snapshots)));
    }

    public OrderView get(UUID userId, UUID orderId) {
        return OrderView.from(orders.findByIdAndUserId(orderId, userId).orElseThrow(OrderService::notFound));
    }

    public Page<OrderView> list(UUID userId, int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid pagination");
        return orders.findByUserId(userId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by("id")))).map(OrderView::from);
    }

    @Transactional
    public OrderView cancel(UUID userId, UUID orderId) {
        CustomerOrder order = orders.lockOwned(orderId, userId).orElseThrow(OrderService::notFound);
        if (order.cancel()) {
            order.getItems().stream().sorted(Comparator.comparing(OrderItem::getProductId))
                    .forEach(item -> stock.restore(item.getProductId(), item.getQuantity()));
        }
        return OrderView.from(order);
    }

    private static ApiException notFound() { return new ApiException(HttpStatus.NOT_FOUND, "Order not found"); }
}
