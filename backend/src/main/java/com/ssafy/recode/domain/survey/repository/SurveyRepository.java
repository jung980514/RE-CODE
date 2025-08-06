package com.ssafy.recode.domain.survey.repository;

import com.ssafy.recode.domain.survey.entity.SurveyQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
}
