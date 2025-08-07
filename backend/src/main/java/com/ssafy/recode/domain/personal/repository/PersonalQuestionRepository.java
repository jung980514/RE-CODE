package com.ssafy.recode.domain.personal.repository;

import com.ssafy.recode.domain.personal.entity.PersonalQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonalQuestionRepository extends JpaRepository<PersonalQuestion, Long> {

  /**
   * 해당 유저가 마지막으로 답변한 questionId 보다 큰 것 중에서 상위 3개를 ID 오름차순으로 가져옵니다.
   */
  List<PersonalQuestion> findTop3ByUserIdAndQuestionIdGreaterThanOrderByQuestionIdAsc(
      Long userId, Long lastQuestionId);

  /**
   * 해당 유저의 모든 질문 중 ID 오름차순으로 상위 3개를 가져옵니다.
   */
  List<PersonalQuestion> findTop3ByUserIdOrderByQuestionIdAsc(Long userId);
}
