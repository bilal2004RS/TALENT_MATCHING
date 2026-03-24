package com.talentmatch.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "offres")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Offre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long recruteurId;
    private String titrePoste;
    private String secteur;
    private String localisation;
    private String niveauRequis;

    @Column(columnDefinition = "TEXT")
    private String competencesRequises;

    private Integer salaireEstime;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Long mlJobId; // ← ID retourné par FastAPI

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private Boolean active = true;
}