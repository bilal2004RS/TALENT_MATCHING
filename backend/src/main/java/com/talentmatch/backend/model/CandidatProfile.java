package com.talentmatch.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidat_profiles")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidatProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private String niveau;
    private Integer anneesExperience;
    private Double scoreCv;
    private String localisation;

    @Column(columnDefinition = "TEXT")
    private String competences;    // JSON array

    @Column(columnDefinition = "TEXT")
    private String softSkills;     // JSON array

    @Column(columnDefinition = "TEXT")
    private String pointsForts;

    @Column(columnDefinition = "TEXT")
    private String pointsAmeliorer;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}