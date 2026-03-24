package com.talentmatch.backend.controller;

import com.talentmatch.backend.model.CandidatProfile;
import com.talentmatch.backend.repository.CandidatProfileRepository;
import com.talentmatch.backend.service.MLService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/candidat")
@RequiredArgsConstructor
public class CandidatController {

    private final MLService                 mlService;
    private final CandidatProfileRepository profileRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();


    // ── Upload CV + Save profile ──────────────────
    @PostMapping("/upload-cv/{userId}")
    public ResponseEntity<?> uploadCV(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> analysis = mlService.uploadCV(userId, file);

            // Save profile f PostgreSQL
            CandidatProfile profile = profileRepo
                .findByUserId(userId)
                .orElse(new CandidatProfile());

            profile.setUserId(userId);
            profile.setNiveau((String) analysis.get("niveau"));
            profile.setAnneesExperience(
                ((Number) analysis.getOrDefault("annees_experience", 0)).intValue());
            profile.setScoreCv(
                ((Number) analysis.getOrDefault("score_cv", 0.0)).doubleValue());
            profile.setLocalisation(
                (String) analysis.getOrDefault("localisation", ""));
            profile.setCompetences(
                objectMapper.writeValueAsString(
                    analysis.getOrDefault("competences", List.of())));
            profile.setSoftSkills(
                objectMapper.writeValueAsString(
                    analysis.getOrDefault("soft_skills", List.of())));
            profile.setPointsForts(
                (String) analysis.getOrDefault("points_forts", ""));
            profile.setPointsAmeliorer(
                (String) analysis.getOrDefault("points_ameliorer", ""));
            profile.setUpdatedAt(LocalDateTime.now());

            profileRepo.save(profile);
            return ResponseEntity.ok(analysis);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ── Get profile sauvegardé ────────────────────
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {
        return profileRepo.findByUserId(userId)
            .map(p -> {
                try {
                    Map<String, Object> res = new HashMap<>();
                    res.put("userId",           p.getUserId());
                    res.put("niveau",           p.getNiveau());
                    res.put("annees_experience",p.getAnneesExperience());
                    res.put("score_cv",         p.getScoreCv());
                    res.put("localisation",     p.getLocalisation());
                    res.put("competences",
                        objectMapper.readValue(p.getCompetences(), List.class));
                    res.put("soft_skills",
                        objectMapper.readValue(p.getSoftSkills(), List.class));
                    res.put("points_forts",     p.getPointsForts());
                    res.put("points_ameliorer", p.getPointsAmeliorer());
                    res.put("updated_at",       p.getUpdatedAt().toString());
                    return ResponseEntity.ok(res);
                } catch (Exception e) {
                    return ResponseEntity.status(500)
                        .body(Map.of("error", e.getMessage()));
                }
            })
            .orElse(ResponseEntity.ok(Map.of("exists", false)));
    }

    // ── Talent Score CV ───────────────────────────
    @PostMapping("/talent-score-cv")
    public ResponseEntity<?> getTalentScoreCV(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(mlService.getTalentScoreCV(file));
    }

    // ── Offres CV ─────────────────────────────────
    @PostMapping("/offres-cv")
    public ResponseEntity<?> getOffresFromCV(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "5") int topN) {
        return ResponseEntity.ok(mlService.getOffresFromCV(file, topN));
    }

    // ── Orientation CV ────────────────────────────
    @PostMapping("/orientation-cv")
    public ResponseEntity<?> getOrientationFromCV(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(mlService.getOrientationFromCV(file));
    }

    // ── Talent Score dataset ──────────────────────
    @GetMapping("/talent-score/{candidateId}")
    public ResponseEntity<?> getTalentScore(
            @PathVariable Long candidateId) {
        return ResponseEntity.ok(mlService.getTalentScore(candidateId));
    }
}