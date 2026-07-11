package com.campusnoteshub.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Global JWT authentication filter for the API Gateway.
 * Validates JWT tokens and forwards user info headers to downstream services.
 * Public endpoints (auth routes) are excluded from validation.
 * Admin endpoints require ADMIN role in the JWT.
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;

    /** Paths that do not require authentication */
    private static final List<String> PUBLIC_PATHS = List.of(
            "/auth/login",
            "/auth/register",
            "/notes",  // GET /notes is public for browsing
            "/users/count" // Public stat for hero section
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        String method = request.getMethod().name();

        // Allow public endpoints without authentication
        if (isPublicPath(path, method)) {
            return chain.filter(exchange);
        }

        // Block all external access to internal microservice endpoints
        if (path.contains("/internal/")) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        // Check for Authorization header
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        try {
            // Validate token and extract claims
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.getSubject();
            String email = claims.get("email", String.class);
            String role = claims.get("role", String.class);
            if (role == null) role = "USER";

            // Admin route protection: /notes/admin/** and /users/admin/** require ADMIN role
            if (isAdminPath(path) && !"ADMIN".equalsIgnoreCase(role)) {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }

            // Forward user info as headers to downstream services
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Id", userId)
                    .header("X-User-Email", email != null ? email : "")
                    .header("X-User-Role", role)
                    .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());

        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    /**
     * Check if the given path + method is public (no auth required).
     * GET requests to /notes/** are public; POST/PUT/DELETE require auth.
     * All /auth/** paths are public.
     * GET /users/count is public for the hero stats section.
     */
    private boolean isPublicPath(String path, String method) {
        if (path.startsWith("/auth/")) {
            return true;
        }
        // Allow GET requests to notes listing, search, top, and stats (but NOT /notes/admin/**)
        if (path.startsWith("/notes") && !path.startsWith("/notes/admin") && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        // Allow GET /users/count without authentication
        if ("/users/count".equals(path) && "GET".equalsIgnoreCase(method)) {
            return true;
        }
        return false;
    }

    /**
     * Check if the given path is an admin-only route.
     */
    private boolean isAdminPath(String path) {
        return path.startsWith("/notes/admin") || path.startsWith("/users/admin");
    }

    @Override
    public int getOrder() {
        return -1; // Run before other filters
    }
}
