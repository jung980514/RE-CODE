package com.ssafy.recode.domain.cognitive.repository;

import com.ssafy.recode.domain.cognitive.entity.CognitiveAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface CognitiveAnswerRepository extends JpaRepository<CognitiveAnswer, Long> {
  /**
   * 해당 유저가 마지막으로 답변한 question_id 의 최대값을 가져옵니다. 아직 답변이 없으면 0을 리턴하도록 COALESCE 처리합니다.
   */
  @Query("SELECT COALESCE(MAX(c.question.questionId), 0) FROM CognitiveAnswer c WHERE c.userId = :userId")
  Long findMaxQuestionIdByUserId(@Param("userId") Long userId);

  /**
   * 당일 인지 질문 답변 확인 용
   * @param userId 사용자 아이디
   * @param start 당일 0시
   * @param end 당일 24시
   * @param mediaType 질문 종류. 음성 : audio, 사진: image
   * @return true: 존재함, false: 없음
   */
  boolean existsByUserIdAndCreatedAtBetweenAndMediaType(Long userId, LocalDateTime start, LocalDateTime end, String mediaType);

}
