package com.talentmatch.backend.controller;

import com.talentmatch.backend.service.MLService;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/offres")
@RequiredArgsConstructor
public class OffreController {

    private final MLService mlService;

    @PostMapping
    public ResponseEntity<?> publierOffre(@RequestBody OffreRequest req) {
        return ResponseEntity.ok(mlService.publierOffre(req));
    }

    @GetMapping
    public ResponseEntity<?> getOffres(
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "")   String secteur,
            @RequestParam(defaultValue = "")   String localisation,
            @RequestParam(defaultValue = "")   String niveau) {
        return ResponseEntity.ok(
            mlService.getOffres(page, limit, secteur, localisation, niveau)
        );
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(mlService.getStats());
    }

    @Data
    public static class OffreRequest {
        private String titrePoste;
        private String secteur;
        private String localisation;
        private String niveaurequis;
        private String competencesRequises;
        private int    salaireEstime;
        private String description;
    }
}