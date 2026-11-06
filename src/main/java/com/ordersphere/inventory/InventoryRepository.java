package com.ordersphere.inventory;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, UUID> {
    @Query("select i.quantity from Inventory i where i.productId = :id")
    Optional<Long> quantity(@Param("id") UUID productId);

    @Modifying
    @Query(value = "update inventory set quantity = quantity - :quantity where product_id = :id and quantity >= :quantity", nativeQuery = true)
    int consume(@Param("id") UUID productId, @Param("quantity") long quantity);

    @Modifying
    @Query(value = "update inventory set quantity = quantity + :delta where product_id = :id and quantity + :delta between 0 and 1000000000", nativeQuery = true)
    int adjust(@Param("id") UUID productId, @Param("delta") long delta);
}
