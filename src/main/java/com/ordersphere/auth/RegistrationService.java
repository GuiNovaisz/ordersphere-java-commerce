package com.ordersphere.auth;

import com.ordersphere.shared.exception.ApiException;
import com.ordersphere.shared.security.AuthenticatedUser;
import com.ordersphere.user.AppUser;
import com.ordersphere.user.UserRepository;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    public RegistrationService(UserRepository users, PasswordEncoder encoder) { this.users = users; this.encoder = encoder; }
    public static void validatePassword(String password) {
        if (password.length() < 12 || password.length() > 64 || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must have 12–64 characters and at most 72 UTF-8 bytes");
        }
    }
    @Transactional
    public AuthenticatedUser register(String email, String password) {
        validatePassword(password);
        var user = users.saveAndFlush(new AppUser(email, encoder.encode(password), "CUSTOMER"));
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole());
    }
}
