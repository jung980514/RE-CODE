package com.ssafy.recode.domain.cognitive.repository;

import com.ssafy.recode.domain.cognitive.entity.CognitiveQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CognitiveQuestionRepository
    extends JpaRepository<CognitiveQuestion, Long> {
}
