package com.talentmatch.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.talentmatch.backend.service.MLService;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final MLService mlService;

    @GetMapping("/skill-gap")
    public ResponseEntity<?> skillGap(
            @RequestParam(defaultValue = "20")  int topN,
            @RequestParam(defaultValue = "all") String filtre) {
        return ResponseEntity.ok(mlService.getSkillGap(topN, filtre));
    }

    @GetMapping("/turnover/{candidateId}")
    public ResponseEntity<?> turnover(@PathVariable Long candidateId) {
        return ResponseEntity.ok(mlService.getTurnoverRisk(candidateId));
    }

    // ← ZID HADO
    @GetMapping("/marche-skills")
    public ResponseEntity<?> marcheSkills(
            @RequestParam(defaultValue = "10") int topN) {
        return ResponseEntity.ok(mlService.getMarketSkills(topN));
    }

    @GetMapping("/cartographie-skills")
    public ResponseEntity<?> cartographie(
            @RequestParam(defaultValue = "15") int topN) {
        return ResponseEntity.ok(mlService.getCartographie(topN));
    }
}