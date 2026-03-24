package com.talentmatch.backend.repository;

import com.talentmatch.backend.model.Offre;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OffreRepository
    extends JpaRepository<Offre, Long> {
    List<Offre> findByRecruteurIdOrderByCreatedAtDesc(Long recruteurId);
    List<Offre> findByActiveTrue();
}