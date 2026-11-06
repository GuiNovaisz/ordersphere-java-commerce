package com.ordersphere.auth;

import com.ordersphere.shared.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final RegistrationService registration;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contexts;
    private final SessionAuthenticationStrategy sessions;
    public AuthController(RegistrationService registration, AuthenticationManager authenticationManager,
                          SecurityContextRepository contexts, SessionAuthenticationStrategy sessions) {
        this.registration = registration; this.authenticationManager = authenticationManager;
        this.contexts = contexts; this.sessions = sessions;
    }
    public record RegisterRequest(@NotBlank @Email @Size(max=255) String email, @NotBlank @Size(min=12,max=64) String password) {}
    public record LoginRequest(@NotBlank @Email @Size(max=255) String email, @NotBlank @Size(max=64) String password) {}
    @GetMapping("/csrf")
    public Map<String,String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName(), "parameterName", token.getParameterName());
    }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public AuthenticatedUser register(@Valid @RequestBody RegisterRequest body) { return registration.register(body.email(), body.password()); }
    @PostMapping("/login")
    public AuthenticatedUser login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        var verified = authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(body.email(), body.password()));
        var identity = ((IdentityDetails) verified.getPrincipal()).identity();
        var authentication = UsernamePasswordAuthenticationToken.authenticated(identity, null, verified.getAuthorities());
        sessions.onAuthentication(authentication, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return identity;
    }
    @GetMapping("/me")
    public AuthenticatedUser me(@AuthenticationPrincipal AuthenticatedUser user) { return user; }
}
