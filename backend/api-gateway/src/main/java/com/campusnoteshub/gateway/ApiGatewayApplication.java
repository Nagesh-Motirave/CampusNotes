package com.campusnoteshub.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API Gateway application entry point.
 * Routes requests to downstream microservices.
 */
@SpringBootApplication
@RestController
public class ApiGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @GetMapping("/")
    public String healthCheck() {
        return "API Gateway is running!";
    }
}
