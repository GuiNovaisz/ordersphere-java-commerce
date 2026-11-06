package com.ordersphere;

import com.jayway.jsonpath.JsonPath;
import com.ordersphere.shared.security.AuthenticatedUser;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Real PostgreSQL, HTTP security and transactional invariants. Docker is required. */
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "server.servlet.session.cookie.secure=false")
@AutoConfigureMockMvc
class BackendIT {
    @Container
    static final PostgreSQLContainer DATABASE = new PostgreSQLContainer("postgres:17-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", DATABASE::getJdbcUrl);
        registry.add("spring.datasource.username", DATABASE::getUsername);
        registry.add("spring.datasource.password", DATABASE::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder encoder;
    @LocalServerPort int port;
    UUID admin;
    UUID alice;
    UUID bob;
    static final String PASSWORD = "StudyOrders!2026";

    @BeforeEach
    void fixtures() {
        // CASCADE only affects this disposable container database.
        jdbc.execute("TRUNCATE TABLE app_users, products CASCADE");
        admin = insertUser("admin@example.test", "ADMIN");
        alice = insertUser("alice@example.test", "CUSTOMER");
        bob = insertUser("bob@example.test", "CUSTOMER");
    }

    @Test
    void registrationCannotChooseRoleAndPasswordsAreHashed() throws Exception {
        mvc.perform(json(post("/api/v1/auth/register"),
                "{\"email\":\"new@example.test\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist());
        String hash = jdbc.queryForObject("select password_hash from app_users where email=?",
                String.class, "new@example.test");
        assertThat(hash).isNotEqualTo(PASSWORD);
        assertThat(encoder.matches(PASSWORD, hash)).isTrue();
        mvc.perform(json(post("/api/v1/auth/register"),
                "{\"email\":\"evil@example.test\",\"password\":\"" + PASSWORD + "\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(json(post("/api/v1/auth/register"),
                "{\"email\":\"new@example.test\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void realSessionLoginLogoutCsrfAndInvalidCredentials() throws Exception {
        SessionClient client = new SessionClient();
        assertThat(client.post("/api/v1/auth/login", "{\"email\":\"alice@example.test\",\"password\":\"wrong\"}")
                .statusCode()).isEqualTo(401);
        client.login("alice@example.test");
        assertThat(client.get("/api/v1/auth/me").statusCode()).isEqualTo(200);
        HttpResponse<String> missingCsrf = client.client.send(HttpRequest.newBuilder(uri("/api/v1/orders"))
                .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{\"items\":[]}"))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertThat(missingCsrf.statusCode()).isEqualTo(403);
        assertThat(client.post("/api/v1/auth/logout", "{}").statusCode()).isIn(200, 204);
        assertThat(client.get("/api/v1/auth/me").statusCode()).isEqualTo(401);
        HttpResponse<String> invalidSession = HttpClient.newHttpClient().send(HttpRequest.newBuilder(uri("/api/v1/auth/me"))
                .header("Cookie", "JSESSIONID=invalid-session-value").build(), HttpResponse.BodyHandlers.ofString());
        assertThat(invalidSession.statusCode()).isEqualTo(401);
    }

    @Test
    void authenticationRbacAndValidationUseProblemResponses() throws Exception {
        mvc.perform(get("/api/v1/orders")).andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
        mvc.perform(get("/api/v1/admin/inventory").with(as(alice, "CUSTOMER")))
                .andExpect(status().isForbidden());
        mvc.perform(json(post("/api/v1/orders").with(as(alice, "CUSTOMER")), "{\"items\":[]}"))
                .andExpect(status().isBadRequest());
        mvc.perform(json(post("/api/v1/admin/products").with(as(admin, "ADMIN")),
                "{\"name\":\"Bad\",\"description\":\"\",\"sku\":\"BAD\",\"price\":-1,\"active\":true}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/products").param("size", "100000"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidRegistrationCannotPersistUser() throws Exception {
        mvc.perform(json(post("/api/v1/auth/register"), "{\"email\":\"not-an-email\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
        assertThat(jdbc.queryForObject("select count(*) from app_users", Integer.class)).isEqualTo(3);
    }

    @Test
    void productMassAssignmentAndMalformedInputAreRejected() throws Exception {
        String extraField = productJson("MASS-1", "Product", "1.00", true).replace("}", ",\"id\":\"" + UUID.randomUUID() + "\"}");
        mvc.perform(json(post("/api/v1/admin/products").with(as(admin, "ADMIN")), extraField))
                .andExpect(status().isBadRequest());
        mvc.perform(json(post("/api/v1/admin/products").with(as(admin, "ADMIN")), "{broken"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/products/not-a-uuid")).andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("select count(*) from products", Integer.class)).isZero();
    }

    @Test
    void paginationAndSortHaveStableMetadataAndBoundedResults() throws Exception {
        product("PAGE-1", "Alpha", "1.00", true);
        product("PAGE-2", "Zulu", "9.00", true);
        mvc.perform(get("/api/v1/products").param("size", "1").param("sort", "price,desc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].sku").value("PAGE-2"))
                .andExpect(jsonPath("$.page.totalElements").value(2))
                .andExpect(jsonPath("$.page.totalPages").value(2));
        mvc.perform(get("/api/v1/products").param("sort", "passwordHash,asc"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/products").param("page", "-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginRotatesSessionIdAndCsrfToken() throws Exception {
        SessionClient client = new SessionClient();
        String anonymousSession = client.cookies.getCookieStore().getCookies().stream()
                .filter(cookie -> cookie.getName().equals("JSESSIONID")).findFirst().orElseThrow().getValue();
        String oldToken = client.token;
        client.login("alice@example.test");
        String authenticatedSession = client.cookies.getCookieStore().getCookies().stream()
                .filter(cookie -> cookie.getName().equals("JSESSIONID")).findFirst().orElseThrow().getValue();
        assertThat(authenticatedSession).isNotEqualTo(anonymousSession);
        assertThat(client.token).isNotEqualTo(oldToken);
        HttpResponse<String> oldCsrf = client.client.send(HttpRequest.newBuilder(uri("/api/v1/orders"))
                .header("Content-Type", "application/json").header(client.header, oldToken)
                .POST(HttpRequest.BodyPublishers.ofString("{\"items\":[]}")).build(), HttpResponse.BodyHandlers.ofString());
        assertThat(oldCsrf.statusCode()).isEqualTo(403);
        assertThat(client.get("/api/v1/admin/products").statusCode()).isEqualTo(403);
    }

    @Test
    void catalogFiltersStatusSkuUniquenessAndStockAdjustments() throws Exception {
        UUID product = product("BOOK-1", "Java Book", "49.90", true);
        UUID inactive = product("BOOK-2", "Old Book", "20.00", false);
        mvc.perform(get("/api/v1/products").param("name", "Java").param("sku", "BOOK-1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1));
        mvc.perform(get("/api/v1/products/" + inactive)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/admin/products").with(as(admin, "ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(2));
        mvc.perform(json(post("/api/v1/admin/products").with(as(admin, "ADMIN")), productJson("BOOK-1", "Duplicate", "1.00", true)))
                .andExpect(status().isConflict());
        stock(product, 5);
        stock(product, -2);
        mvc.perform(json(patch("/api/v1/admin/inventory/" + product).with(as(admin, "ADMIN")), "{\"delta\":-4}"))
                .andExpect(status().isConflict());
        assertStock(product, 3);
        mvc.perform(json(patch("/api/v1/admin/products/" + product + "/status").with(as(admin, "ADMIN")), "{\"active\":false}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/products/" + product)).andExpect(status().isNotFound());
    }

    @Test
    void ordersPreservePriceSnapshotsOwnershipAndIdempotentCancellation() throws Exception {
        UUID product = product("SNAP-1", "Original Name", "100.00", true);
        stock(product, 2);
        UUID order = createOrder(alice, items(product, 1));
        mvc.perform(json(put("/api/v1/admin/products/" + product).with(as(admin, "ADMIN")),
                productJson("SNAP-1", "New Name", "120.00", true))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/orders/" + order).with(as(alice, "CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(100.00))
                .andExpect(jsonPath("$.items[0].unitPrice").value(100.00))
                .andExpect(jsonPath("$.items[0].productName").value("Original Name"));
        mvc.perform(get("/api/v1/orders/" + order).with(as(bob, "CUSTOMER"))).andExpect(status().isNotFound());
        mvc.perform(json(post("/api/v1/orders/" + order + "/cancel").with(as(bob, "CUSTOMER")), "{}"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/orders").with(as(bob, "CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(0));
        for (int i = 0; i < 2; i++) {
            mvc.perform(json(post("/api/v1/orders/" + order + "/cancel").with(as(alice, "CUSTOMER")), "{}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        }
        assertStock(product, 2);
    }

    @Test
    void multiItemFailureRollsBackEveryStockDecrement() throws Exception {
        UUID first = product("ROLL-1", "First", "1.00", true);
        UUID second = product("ROLL-2", "Second", "2.00", true);
        UUID lower = first.compareTo(second) < 0 ? first : second;
        UUID higher = lower.equals(first) ? second : first;
        stock(lower, 1);
        mvc.perform(json(post("/api/v1/orders").with(as(alice, "CUSTOMER")),
                "{\"items\":[{\"productId\":\"" + lower + "\",\"quantity\":1},{\"productId\":\"" + higher + "\",\"quantity\":1}]}"))
                .andExpect(status().isConflict());
        assertStock(lower, 1);
        assertStock(higher, 0);
        mvc.perform(get("/api/v1/orders").with(as(alice, "CUSTOMER")))
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void twoSimultaneousHttpPurchasesCannotOversellOneUnit() throws Exception {
        UUID product = product("RACE-1", "Last unit", "29.90", true);
        stock(product, 1);
        SessionClient first = new SessionClient();
        SessionClient second = new SessionClient();
        first.login("alice@example.test");
        second.login("bob@example.test");
        CyclicBarrier start = new CyclicBarrier(2);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var one = executor.submit(() -> { start.await(10, TimeUnit.SECONDS); return first.post("/api/v1/orders", items(product, 1)).statusCode(); });
            var two = executor.submit(() -> { start.await(10, TimeUnit.SECONDS); return second.post("/api/v1/orders", items(product, 1)).statusCode(); });
            assertThat(List.of(one.get(30, TimeUnit.SECONDS), two.get(30, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(201, 409);
        }
        assertStock(product, 0);
        int aliceCount = countOrders(alice);
        int bobCount = countOrders(bob);
        assertThat(aliceCount + bobCount).isEqualTo(1);
    }

    @Test
    void simultaneousCancellationRestoresStockOnlyOnce() throws Exception {
        UUID product = product("CANCEL-1", "Cancellation", "5.00", true);
        stock(product, 1);
        UUID order = createOrder(alice, items(product, 1));
        CyclicBarrier start = new CyclicBarrier(2);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> { start.await(10, TimeUnit.SECONDS); return mvc.perform(json(post("/api/v1/orders/" + order + "/cancel").with(as(alice, "CUSTOMER")), "{}")).andReturn().getResponse().getStatus(); });
            var second = executor.submit(() -> { start.await(10, TimeUnit.SECONDS); return mvc.perform(json(post("/api/v1/orders/" + order + "/cancel").with(as(alice, "CUSTOMER")), "{}")).andReturn().getResponse().getStatus(); });
            assertThat(List.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS)))
                    .containsExactly(200, 200);
        }
        assertStock(product, 1);
    }

    @Test
    void inactiveAndDuplicateProductsCannotConsumeStock() throws Exception {
        UUID inactive = product("OFF-1", "Inactive", "5.00", false);
        stock(inactive, 1);
        mvc.perform(json(post("/api/v1/orders").with(as(alice, "CUSTOMER")), items(inactive, 1)))
                .andExpect(status().isNotFound());
        assertStock(inactive, 1);
        UUID active = product("DUP-1", "Active", "5.00", true);
        stock(active, 2);
        mvc.perform(json(post("/api/v1/orders").with(as(alice, "CUSTOMER")),
                "{\"items\":[{\"productId\":\"" + active + "\",\"quantity\":1},{\"productId\":\"" + active + "\",\"quantity\":1}]}"))
                .andExpect(status().isBadRequest());
        assertStock(active, 2);
    }

    @Test
    void cancellationCapacityConflictRollsBackStatusAndStock() throws Exception {
        UUID product = product("CAP-1", "Capacity", "1.00", true);
        stock(product, 1);
        UUID order = createOrder(alice, items(product, 1));
        stock(product, 1_000_000_000);
        mvc.perform(json(post("/api/v1/orders/" + order + "/cancel").with(as(alice, "CUSTOMER")), "{}"))
                .andExpect(status().isConflict());
        assertStock(product, 1_000_000_000);
        mvc.perform(get("/api/v1/orders/" + order).with(as(alice, "CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void migrationsAndOpenApiAreAvailable() throws Exception {
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history where success=true", Integer.class)).isPositive();
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/orders']").exists())
                .andExpect(jsonPath("$.components.schemas").exists());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void databaseRejectsNegativeInventoryAndDuplicateSkuWithoutServiceChecks() throws Exception {
        UUID product = product("DB-1", "Database invariant", "1.00", true);
        assertThatThrownBy(() -> jdbc.update("update inventory set quantity=-1 where product_id=?", product))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        assertStock(product, 0);
        assertThatThrownBy(() -> jdbc.update("insert into products(id,name,description,sku,price,active,created_at,updated_at) "
                + "values (?, 'duplicate', '', 'DB-1', 1.00, true, now(), now())", UUID.randomUUID()))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    private UUID insertUser(String email, String role) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into app_users(id,email,password_hash,role,created_at) values (?,?,?,?,now())",
                id, email, encoder.encode(PASSWORD), role);
        return id;
    }

    private RequestPostProcessor as(UUID id, String role) {
        return authentication(new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(id, "fixture@example.test", role), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
        return request.with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private UUID product(String sku, String name, String price, boolean active) throws Exception {
        MvcResult result = mvc.perform(json(post("/api/v1/admin/products").with(as(admin, "ADMIN")),
                productJson(sku, name, price, active))).andExpect(status().isCreated()).andReturn();
        return UUID.fromString(JsonPath.read(result.getResponse().getContentAsString(), "$.id"));
    }

    private String productJson(String sku, String name, String price, boolean active) {
        return "{\"name\":\"" + name + "\",\"description\":\"Test product\",\"sku\":\"" + sku
                + "\",\"price\":" + price + ",\"active\":" + active + "}";
    }

    private void stock(UUID product, int delta) throws Exception {
        mvc.perform(json(patch("/api/v1/admin/inventory/" + product).with(as(admin, "ADMIN")),
                "{\"delta\":" + delta + "}")).andExpect(status().isOk());
    }

    private void assertStock(UUID product, int expected) throws Exception {
        mvc.perform(get("/api/v1/admin/inventory/" + product).with(as(admin, "ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.quantity").value(expected));
    }

    private String items(UUID product, int quantity) {
        return "{\"items\":[{\"productId\":\"" + product + "\",\"quantity\":" + quantity + "}]}";
    }

    private UUID createOrder(UUID user, String body) throws Exception {
        MvcResult result = mvc.perform(json(post("/api/v1/orders").with(as(user, "CUSTOMER")), body))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(JsonPath.read(result.getResponse().getContentAsString(), "$.id"));
    }

    private int countOrders(UUID user) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/orders").with(as(user, "CUSTOMER")))
                .andExpect(status().isOk()).andReturn();
        Number total = JsonPath.read(result.getResponse().getContentAsString(), "$.page.totalElements");
        return total.intValue();
    }

    private URI uri(String path) { return URI.create("http://localhost:" + port + path); }

    private final class SessionClient {
        final HttpClient client;
        final CookieManager cookies;
        String token;
        String header;

        SessionClient() throws Exception {
            cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
            client = HttpClient.newBuilder().cookieHandler(cookies).connectTimeout(Duration.ofSeconds(10)).build();
            refreshCsrf();
        }

        HttpResponse<String> get(String path) throws Exception {
            return client.send(HttpRequest.newBuilder(uri(path)).timeout(Duration.ofSeconds(20)).GET().build(),
                    HttpResponse.BodyHandlers.ofString());
        }

        HttpResponse<String> post(String path, String body) throws Exception {
            return client.send(HttpRequest.newBuilder(uri(path)).timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json").header(header, token)
                    .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
        }

        void refreshCsrf() throws Exception {
            HttpResponse<String> response = get("/api/v1/auth/csrf");
            assertThat(response.statusCode()).isEqualTo(200);
            token = JsonPath.read(response.body(), "$.token");
            header = JsonPath.read(response.body(), "$.headerName");
        }

        void login(String email) throws Exception {
            HttpResponse<String> response = post("/api/v1/auth/login", "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}");
            assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
            refreshCsrf();
        }
    }
}
