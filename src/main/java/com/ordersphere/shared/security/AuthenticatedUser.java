package com.ordersphere.shared.security;

import java.io.Serializable;
import java.security.Principal;
import java.util.UUID;

public record AuthenticatedUser(UUID id, String email, String role) implements Principal, Serializable {
    @Override public String getName() { return email; }
}
