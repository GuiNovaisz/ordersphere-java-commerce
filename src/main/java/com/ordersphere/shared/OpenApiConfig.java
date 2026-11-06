package com.ordersphere.shared;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.*;
import io.swagger.v3.oas.models.media.*;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.*;

@Configuration
public class OpenApiConfig {
    @Bean OpenAPI orderSphereApi() {
        return new OpenAPI().info(new Info().title("OrderSphere API").version("v0.1.0")
            .description("BRL catalog, inventory and orders. Session cookie authentication. Fetch /api/v1/auth/csrf before mutations and again after login/logout; send returned headerName/token. Errors use RFC 9457. Page sizes 1–100. See docs/api.md for roles and examples."))
            .components(new Components().addSecuritySchemes("session",new SecurityScheme().type(SecurityScheme.Type.APIKEY).in(SecurityScheme.In.COOKIE).name("JSESSIONID")))
            .addSecurityItem(new SecurityRequirement().addList("session"));
    }
    @Bean OpenApiCustomizer responseContracts() {
        return api -> {
            api.getComponents().addSchemas("ApiProblem", new ObjectSchema()
                .addProperty("type",new StringSchema()).addProperty("title",new StringSchema())
                .addProperty("status",new IntegerSchema()).addProperty("detail",new StringSchema())
                .addProperty("instance",new StringSchema()));
            api.getPaths().forEach((path,item) -> item.readOperationsMap().forEach((method,operation) -> {
                boolean publicPath=path.startsWith("/api/v1/products") || path.equals("/api/v1/auth/csrf")
                    || path.equals("/api/v1/auth/register") || path.equals("/api/v1/auth/login");
                if(publicPath) operation.setSecurity(java.util.List.of());
                if(method!=PathItem.HttpMethod.GET) operation.addParametersItem(new Parameter().in("header").name("X-CSRF-TOKEN")
                    .required(true).schema(new StringSchema()).description("Fetch the token with GET /api/v1/auth/csrf using the same cookie session. Refresh after login/logout."));
                java.util.Map.of("400","Invalid input", "401","Authentication required or invalid credentials", "403","Role denied or invalid CSRF", "404","Resource not found or not owned", "409","Uniqueness, stock or concurrent update conflict", "500","Unexpected server error")
                    .forEach((status,description) -> operation.getResponses().addApiResponse(status,new ApiResponse().description(description)
                        .content(new Content().addMediaType("application/problem+json",new MediaType().schema(new Schema<>().$ref("#/components/schemas/ApiProblem"))))));
            }));
            api.path("/api/v1/auth/logout", new PathItem().post(new Operation().summary("Invalidate the current session")
                .addTagsItem("auth-controller").addParametersItem(new Parameter().in("header").name("X-CSRF-TOKEN").required(true).schema(new StringSchema()))
                .responses(new io.swagger.v3.oas.models.responses.ApiResponses().addApiResponse("204",new ApiResponse().description("Session invalidated"))
                    .addApiResponse("403",new ApiResponse().description("Invalid CSRF token")))));
        };
    }
}
