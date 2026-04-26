package com.talentmatch.backend.repository;

import com.talentmatch.backend.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByOffreId(Long offreId);
    List<Application> findByUserId(Long userId);
}