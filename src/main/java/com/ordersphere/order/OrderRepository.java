package com.ordersphere.order;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<CustomerOrder, UUID> {
    Optional<CustomerOrder> findByIdAndUserId(UUID id, UUID userId);
    Page<CustomerOrder> findByUserId(UUID userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from CustomerOrder o where o.id = :id and o.userId = :userId")
    Optional<CustomerOrder> lockOwned(@Param("id") UUID id, @Param("userId") UUID userId);
}
