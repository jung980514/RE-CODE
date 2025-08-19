package com.ssafy.recode.domain.survey.repository;

import com.ssafy.recode.domain.survey.entity.SurveyQuestion;
import com.ssafy.recode.global.dto.response.survey.SurveyQAResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SurveyRepository extends JpaRepository<SurveyQuestion, Long> {

  /**
   * 해당 유저가 마지막으로 답변한 question_id 의 최대값을 가져옵니다. 아직 답변이 없으면 0을 리턴하도록 COALESCE 처리합니다.
   */
  @Query("SELECT COALESCE(MAX(s.questionId), 0) FROM SurveyAnswer s WHERE s.userId = :userId")
  Long findMaxQuestionIdByUserId(@Param("userId") Long userId);

  /**
   * 주어진 questionId 보다 큰 것 중에서 ID 오름차순으로 상위 3개를 가져옵니다.
   */
  List<SurveyQuestion> findTop3ByQuestionIdGreaterThanOrderByQuestionIdAsc(Long lastId);

  /**
   * 모든 질문 중 ID 오름차순으로 상위 3개를 가져옵니다.
   * (답변이 한 번도 없거나, 끝까지 다 읽어서 리셋할 때 사용)
   */
  List<SurveyQuestion> findTop3ByOrderByQuestionIdAsc();

  @Query("""
        SELECT new com.ssafy.recode.global.dto.response.survey.SurveyQAResponse(
            q.questionId,
            q.content,
            a.answer,
            a.createdAt
        )
        FROM SurveyAnswer a
        JOIN SurveyQuestion q ON a.questionId = q.questionId
        WHERE a.userId = :userId
          AND a.createdAt BETWEEN :startOfDay AND :endOfDay
        ORDER BY a.createdAt DESC
    """)
  List<SurveyQAResponse> findTodayQAByUserId(
      @Param("userId") Long userId,
      @Param("startOfDay") LocalDateTime startOfDay,
      @Param("endOfDay") LocalDateTime endOfDay
  );
}
