package com.talentmatch.backend.controller;

import com.talentmatch.backend.model.Role;
import com.talentmatch.backend.model.User;
import com.talentmatch.backend.repository.UserRepository;
import com.talentmatch.backend.service.MLService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final MLService      mlService;

    // ── Users ────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(
            @PathVariable Long id,
            @RequestBody RoleRequest req) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User non trouvé"));
        user.setRole(Role.valueOf(req.getRole().toUpperCase()));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "message", "Role mis à jour",
            "user_id", id,
            "new_role", req.getRole()
        ));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé"));
    }

    // ── ML Monitoring ────────────────────────────
    @GetMapping("/monitoring")
    public ResponseEntity<?> getMonitoring() {
        return ResponseEntity.ok(mlService.getMonitoring());
    }

    @GetMapping("/monitoring-ml")
    public ResponseEntity<?> getMonitoringML() {
        return ResponseEntity.ok(mlService.getMonitoringML());
    }

    @GetMapping("/drift")
    public ResponseEntity<?> getDrift() {
        return ResponseEntity.ok(mlService.getDrift());
    }

    @Data
    public static class RoleRequest {
        private String role;
    }
}