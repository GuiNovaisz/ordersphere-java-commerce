package com.ordersphere.user;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "app_users")
public class AppUser {
    @Id private UUID id;
    @Column(nullable = false, unique = true, length = 255) private String email;
    @Column(name = "password_hash", nullable = false, length = 255) private String passwordHash;
    @Column(nullable = false, length = 20) private String role;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    protected AppUser() {}
    public AppUser(String email, String passwordHash, String role) {
        if (!role.equals("CUSTOMER") && !role.equals("ADMIN")) throw new IllegalArgumentException("Invalid role");
        this.id = UUID.randomUUID();
        this.email = normalize(email);
        this.passwordHash = passwordHash;
        this.role = role;
        this.createdAt = Instant.now();
    }
    public static String normalize(String email) { return email.strip().toLowerCase(Locale.ROOT); }
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getRole() { return role; }
}
