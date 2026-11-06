package com.ordersphere.auth;

import com.ordersphere.shared.security.AuthenticatedUser;
import com.ordersphere.user.AppUser;
import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record IdentityDetails(AuthenticatedUser identity, String password) implements UserDetails {
    public static IdentityDetails of(AppUser user) {
        return new IdentityDetails(new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole()), user.getPasswordHash());
    }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return java.util.List.of(new SimpleGrantedAuthority("ROLE_" + identity.role())); }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return identity.email(); }
}
