package com.ssafy.recode.domain.survey.repository;

import com.ssafy.recode.domain.survey.entity.SurveyQuestion;
import com.ssafy.recode.global.dto.response.survey.SurveyQAResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SurveyRepository extends JpaRepository<SurveyQuestion, Long> {

  // 해당 월 질문 중 OFFSET 기준으로 3개 조회
  @Query(value = """
        SELECT content
        FROM survey_questions
        WHERE question_id <= (
          SELECT MAX(question_id) - ((DAY(CURRENT_DATE()) - 1) * 3)
          FROM survey_questions
          WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        )
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        ORDER BY question_id DESC
        LIMIT 3
        """, nativeQuery = true)
  List<String> findTodayQuestions();

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
