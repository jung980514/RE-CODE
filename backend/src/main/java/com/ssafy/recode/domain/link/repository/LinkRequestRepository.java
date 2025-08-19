package com.ssafy.recode.domain.link.repository;

import com.ssafy.recode.domain.link.entity.LinkRequest;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LinkRequestRepository extends JpaRepository<LinkRequest, Long> {

  boolean existsByElderIdAndGuardianId(Long elderId, Long guardianId);

  Optional<LinkRequest> findByElderIdAndGuardianId(Long elderId, Long guardianId);

//  void invalidateByElderId(Long elderId);

  List<LinkRequest> findAllByElderId(Long elderId);

  void deleteByGuardianIdAndElderId(Long guardianId, Long elderId);
}