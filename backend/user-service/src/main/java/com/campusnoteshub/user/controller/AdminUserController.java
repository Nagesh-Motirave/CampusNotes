package com.campusnoteshub.user.controller;

import com.campusnoteshub.user.dto.AdminUserAnalyticsDTO;
import com.campusnoteshub.user.model.User;
import com.campusnoteshub.user.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only user analytics controller.
 * Protected by API gateway (X-User-Role = ADMIN required).
 */
@RestController
@RequestMapping("/users/admin")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    private boolean isAdmin(String role) {
        return "ADMIN".equalsIgnoreCase(role);
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminUserService.getOverviewStats());
    }

    @GetMapping("/by-college")
    public ResponseEntity<?> getUsersByCollege(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminUserService.getUsersByCollege());
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentUsers(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminUserService.getRecentUsers());
    }

    @GetMapping("/top-contributors")
    public ResponseEntity<?> getTopContributors(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminUserService.getTopContributors());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String id,
                                            @RequestBody Map<String, String> body,
                                            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        String newRole = body.get("role");
        if (newRole == null || (!newRole.equals("USER") && !newRole.equals("ADMIN"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role must be USER or ADMIN"));
        }
        return ResponseEntity.ok(adminUserService.updateUserRole(id, newRole));
    }
}
