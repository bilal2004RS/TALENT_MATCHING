package com.talentmatch.backend.controller;



import com.talentmatch.backend.service.MLService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final MLService mlService;

    @GetMapping("/cv/{candidateId}")
    public ResponseEntity<?> matchCV(
            @PathVariable Long candidateId,
            @RequestParam(defaultValue = "5") int topN) {
        return ResponseEntity.ok(
            mlService.matchCVtoOffres(candidateId, topN)
        );
    }

    @GetMapping("/offre/{jobId}")
    public ResponseEntity<?> matchOffre(
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "5") int topN) {
        return ResponseEntity.ok(
            mlService.matchOffreToCVs(jobId, topN)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topN) {
        return ResponseEntity.ok(
            mlService.semanticSearch(query, topN)
        );
    }
}