package com.ssafy.recode.domain.basic.repository;

import com.ssafy.recode.domain.basic.entity.BasicAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BasicAnswerRepository extends JpaRepository<BasicAnswer, Long> {

  /**
   * 해당 유저가 마지막으로 답변한 question_id 의 최대값을 가져옵니다. 아직 답변이 없으면 0을 리턴하도록 COALESCE 처리합니다.
   */
  @Query("SELECT COALESCE(MAX(b.questionId), 0) FROM BasicAnswer b WHERE b.userId = :userId")
  Long findMaxQuestionIdByUserId(@Param("userId") Long userId);
}
