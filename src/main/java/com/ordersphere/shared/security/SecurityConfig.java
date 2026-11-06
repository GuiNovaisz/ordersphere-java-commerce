package com.ordersphere.shared.security;

import com.ordersphere.auth.IdentityDetails;
import com.ordersphere.user.AppUser;
import com.ordersphere.user.UserRepository;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.*;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.*;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwords() { return new BCryptPasswordEncoder(12); }
    @Bean AuthenticationManager authenticationManager(UserRepository users, PasswordEncoder encoder) {
        var provider = new DaoAuthenticationProvider(email -> IdentityDetails.of(users.findByEmail(AppUser.normalize(email))
            .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"))));
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }
    @Bean SecurityContextRepository securityContexts() { return new HttpSessionSecurityContextRepository(); }
    @Bean CsrfTokenRepository csrfTokens() { return new HttpSessionCsrfTokenRepository(); }
    @Bean SessionAuthenticationStrategy sessionStrategy(CsrfTokenRepository csrfTokens) {
        return new CompositeSessionAuthenticationStrategy(List.of(new ChangeSessionIdAuthenticationStrategy(), new CsrfAuthenticationStrategy(csrfTokens)));
    }
    @Bean SecurityFilterChain apiSecurity(HttpSecurity http, SecurityContextRepository contexts, CsrfTokenRepository csrfTokens) throws Exception {
        return http
            .securityContext(c -> c.securityContextRepository(contexts))
            .csrf(c -> c.csrfTokenRepository(csrfTokens))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/v1/auth/csrf", "/api/v1/auth/register", "/api/v1/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/products", "/api/v1/products/*", "/actuator/health", "/actuator/health/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/**").authenticated()
                .anyRequest().denyAll())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req,res,ex) -> problem(res,401,"Authentication required"))
                .accessDeniedHandler((req,res,ex) -> problem(res,403,"Access denied or invalid CSRF token")))
            .logout(l -> l.logoutUrl("/api/v1/auth/logout")
                .invalidateHttpSession(true).clearAuthentication(true).deleteCookies("JSESSIONID")
                .logoutSuccessHandler((req,res,auth) -> res.setStatus(204)))
            .build();
    }
    private static void problem(jakarta.servlet.http.HttpServletResponse response, int status, String detail) throws java.io.IOException {
        response.setStatus(status); response.setContentType("application/problem+json");
        response.getWriter().write("{\"type\":\"about:blank\",\"status\":" + status + ",\"title\":\"" + (status==401?"Unauthorized":"Forbidden") + "\",\"detail\":\"" + detail + "\"}");
    }
}
