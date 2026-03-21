package com.talentmatch.backend.controller;

import com.talentmatch.backend.model.Role;
import com.talentmatch.backend.model.User;
import com.talentmatch.backend.repository.UserRepository;
import com.talentmatch.backend.service.AuthService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService     authService;
    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/init-admin")
    public ResponseEntity<?> initAdmin() {
        if (userRepository.existsByEmail("admin@talentmatch.com")) {
            return ResponseEntity.ok(Map.of("message", "Admin déjà créé"));
        }
        User admin = new User();
        admin.setNom("Admin");
        admin.setEmail("admin@talentmatch.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        return ResponseEntity.ok(Map.of(
            "message" , "✅ Admin créé",
            "email"   , "admin@talentmatch.com",
            "password", "admin123"
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    // ── DTOs ─────────────────────────────────────────────
    @Data public static class RegisterRequest {
        private String email;
        private String password;
        private String nom;
        private String role;

    }

    @Data public static class LoginRequest {
        private String email;
        private String password;
    }
}
