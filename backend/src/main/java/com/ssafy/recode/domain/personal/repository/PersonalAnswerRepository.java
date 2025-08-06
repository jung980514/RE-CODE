package com.ssafy.recode.domain.personal.repository;

import com.ssafy.recode.domain.personal.entity.PersonalAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PersonalAnswerRepository extends JpaRepository<PersonalAnswer, Long> {
    Optional<Object> findByUserIdAndCreatedAt(Long userId, LocalDateTime createdAt);
}
