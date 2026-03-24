package com.talentmatch.backend.controller;

import com.talentmatch.backend.model.Offre;
import com.talentmatch.backend.repository.OffreRepository;
import com.talentmatch.backend.service.MLService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/offres")
@RequiredArgsConstructor
public class OffreController {

    private final MLService     mlService;
    private final OffreRepository offreRepo;

    // ── Publier offre + save DB ───────────────────
    @PostMapping
    public ResponseEntity<?> publierOffre(
            @RequestBody OffreRequest req) {
        try {
            // 1. Envoyer à FastAPI pour embedding
            Map<String, Object> mlRes = mlService.publierOffre(req);

            // 2. Save f PostgreSQL
            Offre offre = Offre.builder()
                .recruteurId(req.getRecruteurId())
                .titrePoste(req.getTitrePoste())
                .secteur(req.getSecteur())
                .localisation(req.getLocalisation())
                .niveauRequis(req.getNiveaurequis())
                .competencesRequises(req.getCompetencesRequises())
                .salaireEstime(req.getSalaireEstime())
                .description(req.getDescription() != null
                    ? req.getDescription() : "")
                .mlJobId(((Number) mlRes
                    .getOrDefault("job_id", 0)).longValue())
                .createdAt(LocalDateTime.now())
                .active(true)
                .build();

            offreRepo.save(offre);
            mlRes.put("db_id", offre.getId());
            return ResponseEntity.ok(mlRes);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ── Mes offres (par recruteur) ─────────────────
    @GetMapping("/mes-offres/{recruteurId}")
    public ResponseEntity<?> getMesOffres(
            @PathVariable Long recruteurId) {
        List<Offre> offres = offreRepo
            .findByRecruteurIdOrderByCreatedAtDesc(recruteurId);
        return ResponseEntity.ok(offres);
    }

    // ── Toutes offres actives ──────────────────────
    @GetMapping
    public ResponseEntity<?> getOffres(
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "")   String secteur,
            @RequestParam(defaultValue = "")   String localisation,
            @RequestParam(defaultValue = "")   String niveau) {
        return ResponseEntity.ok(
            mlService.getOffres(page, limit, secteur, localisation, niveau));
    }

    // ── Stats dashboard ───────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(mlService.getStats());
    }

    @Data
    public static class OffreRequest {
        private Long   recruteurId;
        private String titrePoste;
        private String secteur;
        private String localisation;
        private String niveaurequis;
        private String competencesRequises;
        private int    salaireEstime;
        private String description;
    }
}