package com.talentmatch.backend.controller;

import com.talentmatch.backend.service.MLService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;   // ← zid
import java.util.Map;    // ← zid

@RestController
@RequestMapping("/api/candidat")
@RequiredArgsConstructor
public class CandidatController {

    private final MLService mlService;

    @PostMapping("/upload-cv/{candidateId}")
    public ResponseEntity<?> uploadCV(
            @PathVariable Long candidateId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(mlService.uploadCV(candidateId, file));
    }

    @GetMapping("/talent-score/{candidateId}")
    public ResponseEntity<?> getTalentScore(
            @PathVariable Long candidateId) {
        return ResponseEntity.ok(mlService.getTalentScore(candidateId));
    }

    @GetMapping("/offres/{candidateId}")
    public ResponseEntity<?> getOffresRecommandees(
            @PathVariable Long candidateId,
            @RequestParam(defaultValue = "5") int topN) {
        List<Map<String, Object>> data =
            mlService.getOffresRecommandees(candidateId, topN);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/orientation/{candidateId}")
    public ResponseEntity<?> getOrientation(
            @PathVariable Long candidateId) {
        List<Map<String, Object>> data =
            mlService.getOrientation(candidateId);
        return ResponseEntity.ok(data);
    }
}