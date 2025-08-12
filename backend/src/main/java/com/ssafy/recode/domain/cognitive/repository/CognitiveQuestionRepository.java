package com.ssafy.recode.domain.cognitive.repository;

import com.ssafy.recode.domain.cognitive.entity.CognitiveQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CognitiveQuestionRepository extends JpaRepository<CognitiveQuestion, Long> {

  // lastQuestionId 이후 + mediaType 일치, 오름차순 3개
  List<CognitiveQuestion> findTop3ByQuestionIdGreaterThanAndMediaTypeOrderByQuestionIdAsc(
      Long lastQuestionId, String mediaType
  );

  // mediaType 일치, 오름차순 3개 (초기/리셋용)
  List<CognitiveQuestion> findTop3ByMediaTypeOrderByQuestionIdAsc(String mediaType);
}
