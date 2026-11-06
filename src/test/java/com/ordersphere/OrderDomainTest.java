package com.ordersphere;

import com.ordersphere.catalog.Product;
import com.ordersphere.order.CustomerOrder;
import com.ordersphere.order.OrderItem;
import com.ordersphere.order.OrderStatus;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OrderDomainTest {
    @Test
    void totalsUseExactDecimalArithmetic() {
        OrderItem first = item("0.10", 3);
        OrderItem second = item("29.90", 2);
        CustomerOrder order = new CustomerOrder(UUID.randomUUID(), List.of(first, second));
        assertThat(first.getSubtotal()).isEqualByComparingTo("0.30");
        assertThat(order.getTotal()).isEqualByComparingTo("60.10");
        assertThat(order.getCurrency()).isEqualTo("BRL");
    }

    @Test
    void rejectsInvalidQuantitiesAndFractionalCents() {
        assertThatThrownBy(() -> item("1.00", 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> item("1.00", -1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> item("1.00", 1_000_001)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> item("-0.01", 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> item("1.001", 1)).isInstanceOf(ArithmeticException.class);
    }

    @Test
    void cancellationTransitionsOnlyOnce() {
        CustomerOrder order = new CustomerOrder(UUID.randomUUID(), List.of(item("10.00", 1)));
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(order.cancel()).isTrue();
        var cancelledAt = order.getCancelledAt();
        assertThat(order.cancel()).isFalse();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getCancelledAt()).isEqualTo(cancelledAt);
    }

    @Test
    void orderDefensivelyCopiesItemsAndRejectsDuplicateProducts() {
        List<OrderItem> items = new ArrayList<>();
        OrderItem item = item("10.00", 1);
        items.add(item);
        CustomerOrder order = new CustomerOrder(UUID.randomUUID(), items);
        items.clear();
        assertThat(order.getItems()).hasSize(1);
        assertThatThrownBy(() -> order.getItems().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> new CustomerOrder(UUID.randomUUID(), List.of(item, item)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new CustomerOrder(UUID.randomUUID(), List.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void productNormalizesSkuAndRejectsInvalidMoney() {
        Product product = new Product(" Java Book ", "Description", " book-1 ", new BigDecimal("12.50"), true);
        assertThat(product.getSku()).isEqualTo("BOOK-1");
        assertThat(product.getName()).isEqualTo("Java Book");
        assertThatThrownBy(() -> new Product("Invalid", "", "SPACE SKU", BigDecimal.ONE, true))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Product("Invalid", "", "SKU", new BigDecimal("12.501"), true))
                .isInstanceOf(ArithmeticException.class);
    }

    private OrderItem item(String price, int quantity) {
        return new OrderItem(UUID.randomUUID(), "BOOK", "Java Book", new BigDecimal(price), quantity);
    }
}
