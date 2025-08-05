package com.ssafy.recode.domain.cognitive.repository;

import com.ssafy.recode.domain.cognitive.entity.CognitiveAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CognitiveAnswerRepository
    extends JpaRepository<CognitiveAnswer, Long> {
}
