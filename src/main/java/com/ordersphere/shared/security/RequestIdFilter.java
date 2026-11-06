package com.ordersphere.shared.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String id=UUID.randomUUID().toString();
        response.setHeader("X-Request-ID",id);
        try (var ignored=MDC.putCloseable("requestId",id)) { chain.doFilter(request,response); }
    }
}
