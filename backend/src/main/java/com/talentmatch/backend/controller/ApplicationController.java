package com.talentmatch.backend.controller;

import com.talentmatch.backend.model.Application;
import com.talentmatch.backend.model.User;
import com.talentmatch.backend.repository.ApplicationRepository;
import com.talentmatch.backend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@CrossOrigin
@RequestMapping("/applications")
public class ApplicationController {

    private final ApplicationRepository repo;
    private final UserRepository userRepository;

    

    public ApplicationController(ApplicationRepository repo, 
                                UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    // POSTULER
    @PostMapping
    public Application apply(@RequestBody Application app) {
        app.setStatus("APPLIED");
        app.setCreatedAt(LocalDateTime.now());
        return repo.save(app);
    }

    // GET candidats pour une offre
    @GetMapping("/{offreId}")
    public List<Application> getByOffre(@PathVariable Long offreId) {
        return repo.findByOffreId(offreId);
    }

    // GET جميع applications مع user info
    @GetMapping
public List<Map<String, Object>> getAll() {
    List<Application> apps = repo.findAll();

    return apps.stream().map(app -> {
        Map<String, Object> data = new HashMap<>();

        data.put("id", app.getId());
        data.put("userId", app.getUserId());
        data.put("offreId", app.getOffreId());
        data.put("status", app.getStatus());
        data.put("cvUrl", "/api/candidat/cv/" + app.getUserId());

        User user = userRepository.findById(app.getUserId()).orElse(null);
        if (user != null) {
            data.put("email", user.getEmail());
        }

        return data;
    }).toList();
}
    @PutMapping("/{id}/status")
    public Application updateStatus(@PathVariable Long id, @RequestParam String status) {
        Application app = repo.findById(id).orElseThrow();
        app.setStatus(status);
        return repo.save(app);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
    @GetMapping("/user/{userId}")
public List<Application> getByUser(@PathVariable Long userId) {
    return repo.findByUserId(userId);
}
}