package com.talentmatch.backend.repository;

import com.talentmatch.backend.model.CandidatProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CandidatProfileRepository
    extends JpaRepository<CandidatProfile, Long> {
    Optional<CandidatProfile> findByUserId(Long userId);
}