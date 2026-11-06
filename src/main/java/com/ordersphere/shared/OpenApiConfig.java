package com.ordersphere.shared;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.*;

@Configuration
public class OpenApiConfig {
    @Bean OpenAPI orderSphereApi() {
        return new OpenAPI().info(new Info().title("OrderSphere API").version("v0.1.0")
            .description("BRL catalog, inventory and orders. Session cookie authentication. Fetch /api/v1/auth/csrf before mutations and again after login/logout; send returned headerName/token. Errors use RFC 9457. Page sizes 1–100. See docs/api.md for roles and examples."))
            .components(new Components().addSecuritySchemes("session",new SecurityScheme().type(SecurityScheme.Type.APIKEY).in(SecurityScheme.In.COOKIE).name("JSESSIONID")))
            .addSecurityItem(new SecurityRequirement().addList("session"));
    }
}
