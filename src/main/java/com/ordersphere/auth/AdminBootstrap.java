package com.ordersphere.auth;

import com.ordersphere.user.AppUser;
import com.ordersphere.user.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminBootstrap implements ApplicationRunner {
    private final Environment environment; private final UserRepository users; private final PasswordEncoder passwords;
    public AdminBootstrap(Environment environment, UserRepository users, PasswordEncoder passwords) { this.environment=environment; this.users=users; this.passwords=passwords; }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        String email=environment.getProperty("ORDERSPHERE_ADMIN_EMAIL"), password=environment.getProperty("ORDERSPHERE_ADMIN_PASSWORD");
        if (email==null && password==null) return;
        if (email==null || password==null) throw new IllegalStateException("Both bootstrap admin variables are required");
        if (users.existsByRole("ADMIN")) return;
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || email.length()>255) throw new IllegalStateException("Invalid bootstrap admin email");
        RegistrationService.validatePassword(password);
        users.saveAndFlush(new AppUser(email,passwords.encode(password),"ADMIN"));
    }
}
