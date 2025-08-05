package com.ssafy.recode.domain.link.repository;

import com.ssafy.recode.domain.link.entity.GuardianElder;
import com.ssafy.recode.domain.link.entity.GuardianElderId;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 보호자-노인 연동 매핑 Repository
 */
public interface GuardianElderRepository extends JpaRepository<GuardianElder, GuardianElderId>, GuardianElderCustomRepository  {

  boolean existsByGuardianIdAndElderId(Long guardianId, Long elderId);
  void deleteByGuardianIdAndElderId(Long guardianId, Long elderId);

}
