package com.talentmatch.backend.service;



import com.talentmatch.backend.config.JwtConfig;
import com.talentmatch.backend.controller.AuthController.*;
import com.talentmatch.backend.model.*;
import com.talentmatch.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository    userRepository;
    private final PasswordEncoder encoder; 
    private final JwtConfig         jwtConfig;

    public Map<String, Object> register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email déjà utilisé");

        User user = User.builder()
                .email(req.getEmail())
                .password(encoder.encode(req.getPassword()))
                .nom(req.getNom())
                .role(Role.valueOf(req.getRole().toUpperCase()))
                .build();

        userRepository.save(user);
        String token = jwtConfig.generateToken(user.getEmail(), user.getRole().name());

        return Map.of(
            "token", token,
            "role",  user.getRole(),
            "nom",   user.getNom(),
            "userId", user.getId()
        );
    }

public Map<String, Object> login(LoginRequest req) {
    try {
        User user = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> new RuntimeException("Email non trouvé"));

        if (!encoder.matches(req.getPassword(), user.getPassword()))
            throw new RuntimeException("Mot de passe incorrect");

        String token = jwtConfig.generateToken(
            user.getEmail(), user.getRole().name());

        return Map.of(
            "token" , token,
            "role"  , user.getRole().name(),
            "nom"   , user.getNom(),
            "userId", user.getId()

        );
    } catch (Exception e) {
        e.printStackTrace(); // ← ychowd f terminal
        throw e;
    }
}
}