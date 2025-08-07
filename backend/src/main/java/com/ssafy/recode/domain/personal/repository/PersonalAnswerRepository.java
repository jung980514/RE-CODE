package com.ssafy.recode.domain.personal.repository;

import com.ssafy.recode.domain.personal.entity.PersonalAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface PersonalAnswerRepository extends JpaRepository<PersonalAnswer, Long> {

  /**
   * 해당 유저가 마지막으로 답변한 questionId 의 최대값을 가져옵니다.
   * 아직 답변이 없으면 0을 리턴하도록 COALESCE 처리합니다.
   */
  @Query("SELECT COALESCE(MAX(pa.questionId), 0) FROM PersonalAnswer pa WHERE pa.userId = :userId")
  Long findMaxQuestionIdByUserId(@Param("userId") Long userId);

  /**
   * 당일 개인화 질문 답변 확인용
   * @param userId 사용자 아이디
   * @param start 당일 0시
   * @param end 당일 24시
   * @return true: 존재함, false: 없음
   */
  boolean existsByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

}
