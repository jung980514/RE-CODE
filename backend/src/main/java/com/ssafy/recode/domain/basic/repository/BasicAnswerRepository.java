package com.ssafy.recode.domain.basic.repository;

import com.ssafy.recode.domain.basic.entity.BasicAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BasicAnswerRepository extends JpaRepository<BasicAnswer, Long> {
    List<BasicAnswer> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime createdAtAfter, LocalDateTime createdAtBefore);

    Optional<Object> findFirstByUserIdAndCreatedAtBetween(Long userId, LocalDateTime createdAtAfter, LocalDateTime createdAtBefore);

}
