package com.talentmatch.backend.service;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;

import com.talentmatch.backend.controller.OffreController;
import com.talentmatch.backend.controller.CandidatController;
import com.talentmatch.backend.controller.AnalyticsController;

import org.springframework.http.*;
import java.util.*;

@Service
public class MLService {

    @Value("${ml.service.url}")
    private String mlUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── CV → Top offres ──────────────────────────────────
    public List<Map<String, Object>> matchCVtoOffres(Long candidateId, int topN) {
        String url = mlUrl + "/matching/cv-to-offres";

        Map<String, Object> body = Map.of(
            "candidate_id", candidateId,
            "top_n", topN
        );
        HttpEntity<Map<String, Object>> request = buildRequest(body);
        ResponseEntity<List> response = restTemplate.postForEntity(url, request, List.class);
        return response.getBody();
    }

    // ── Offre → Top candidats ────────────────────────────
    public List<Map<String, Object>> matchOffreToCVs(Long jobId, int topN) {
        String url = mlUrl + "/matching/offre-to-cvs";

        Map<String, Object> body = Map.of(
            "job_id", jobId,
            "top_n", topN
        );
        HttpEntity<Map<String, Object>> request = buildRequest(body);
        ResponseEntity<List> response = restTemplate.postForEntity(url, request, List.class);
        return response.getBody();
    }

    // ── Recherche sémantique ─────────────────────────────
    public List<Map<String, Object>> semanticSearch(String query, int topN) {
        String url = mlUrl + "/matching/search";

        Map<String, Object> body = Map.of(
            "query", query,
            "top_n", topN
        );
        HttpEntity<Map<String, Object>> request = buildRequest(body);
        ResponseEntity<List> response = restTemplate.postForEntity(url, request, List.class);
        return response.getBody();
    }

    // ── Skill Gap ────────────────────────────────────────
    public List<Map<String, Object>> getSkillGap(int topN, String filtre) {
        String url = mlUrl + "/analytics/skill-gap?top_n=" + topN + "&filtre=" + filtre;
        ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
        return response.getBody();
    }

    public List<Map<String, Object>> getMarketSkills(int topN) {
    String url = mlUrl + "/analytics/marche-skills?top_n=" + topN;
    return restTemplate.getForEntity(url, List.class).getBody();
}

public List<Map<String, Object>> getCartographie(int topN) {
    String url = mlUrl + "/analytics/cartographie-skills?top_n=" + topN;
    return restTemplate.getForEntity(url, List.class).getBody();
}

    // ── Turnover risk ────────────────────────────────────
    public Map<String, Object> getTurnoverRisk(Long candidateId) {
        String url = mlUrl + "/analytics/turnover-risk/" + candidateId;
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        return response.getBody();
    }

    // ── Helper ───────────────────────────────────────────
    private HttpEntity<Map<String, Object>> buildRequest(Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    // ── CV-based endpoints ────────────────────────────────────────
public Map<String, Object> getTalentScoreCV(MultipartFile file) {
    try {
        return postFile(mlUrl + "/candidat/talent-score-cv", file);
    } catch (Exception e) {
        throw new RuntimeException("Erreur talent score CV: " + e.getMessage());
    }
}

public List<Map<String, Object>> getOffresFromCV(MultipartFile file, int topN) {
    try {
        return postFileList(mlUrl + "/candidat/offres-cv?top_n=" + topN, file);
    } catch (Exception e) {
        throw new RuntimeException("Erreur offres CV: " + e.getMessage());
    }
}

public List<Map<String, Object>> getOrientationFromCV(MultipartFile file) {
    try {
        return postFileList(mlUrl + "/candidat/orientation-cv", file);
    } catch (Exception e) {
        throw new RuntimeException("Erreur orientation CV: " + e.getMessage());
    }
}

// ── Helpers multipart ─────────────────────────────────────────
private Map<String, Object> postFile(String url, MultipartFile file) throws Exception {
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("file", new ByteArrayResource(file.getBytes()) {
        @Override public String getFilename() {
            return file.getOriginalFilename();
        }
    });
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    return restTemplate.postForEntity(
        url, new HttpEntity<>(body, headers), Map.class
    ).getBody();
}

private List<Map<String, Object>> postFileList(String url, MultipartFile file) throws Exception {
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("file", new ByteArrayResource(file.getBytes()) {
        @Override public String getFilename() {
            return file.getOriginalFilename();
        }
    });
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    return restTemplate.postForEntity(
        url, new HttpEntity<>(body, headers), List.class
    ).getBody();
}


    // ── CANDIDAT ─────────────────────────────────────────────────
    public Map<String, Object> uploadCV(Long candidateId,
                                     MultipartFile file) {
    try {
        String url = mlUrl + "/candidat/upload-cv/" + candidateId;
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        });
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> request =
            new HttpEntity<>(body, headers);
        ResponseEntity<Map> res =
            restTemplate.postForEntity(url, request, Map.class);
        return res.getBody();
    } catch (Exception e) {
        throw new RuntimeException("Erreur upload CV: " + e.getMessage());
    }
}

public Map<String, Object> getTalentScore(Long candidateId) {
    String url = mlUrl + "/candidat/talent-score/" + candidateId;
    return restTemplate.getForEntity(url, Map.class).getBody();
}

public List<Map<String, Object>> getOffresRecommandees(Long candidateId, int topN) {
    String url = mlUrl + "/candidat/offres/" + candidateId + "?top_n=" + topN;
    ResponseEntity<List> res = restTemplate.getForEntity(url, List.class);
    return res.getBody();
}

public List<Map<String, Object>> getOrientation(Long candidateId) {
    String url = mlUrl + "/candidat/orientation/" + candidateId;
    ResponseEntity<List> res = restTemplate.getForEntity(url, List.class);
    return res.getBody();
}



// ── OFFRES ───────────────────────────────────────────────────
public Map<String, Object> publierOffre(
        OffreController.OffreRequest req) {
    String url  = mlUrl + "/offres/";
    Map<String, Object> body = Map.of(
        "titre_poste"          , req.getTitrePoste(),
        "secteur"              , req.getSecteur(),
        "localisation"         , req.getLocalisation(),
        "niveau_requis"        , req.getNiveaurequis(),
        "competences_requises" , req.getCompetencesRequises(),
        "salaire_estime"       , req.getSalaireEstime(),
        "description"          , req.getDescription() != null
                                 ? req.getDescription() : ""
    );
    return restTemplate.postForEntity(
        url, buildRequest(body), Map.class
    ).getBody();
}

public Map<String, Object> getOffres(int page, int limit,
        String secteur, String localisation, String niveau) {
    String url = mlUrl + "/offres/?page=" + page
               + "&limit=" + limit
               + "&secteur=" + secteur
               + "&localisation=" + localisation
               + "&niveau=" + niveau;
    return restTemplate.getForEntity(url, Map.class).getBody();
}

public Map<String, Object> getStats() {
    return restTemplate.getForEntity(
        mlUrl + "/offres/stats", Map.class
    ).getBody();
}

// ── ADMIN ────────────────────────────────────────────────────
public Map<String, Object> getMonitoring() {
    return restTemplate.getForEntity(
        mlUrl + "/admin/monitoring", Map.class
    ).getBody();
}

public Map<String, Object> getMonitoringML() {
    return restTemplate.getForEntity(
        mlUrl + "/admin/monitoring-ml", Map.class
    ).getBody();
}

public Map<String, Object> getDrift() {
    return restTemplate.getForEntity(
        mlUrl + "/admin/drift", Map.class
    ).getBody();
}
}