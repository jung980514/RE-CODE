package com.ssafy.recode.domain.basic.repository;

import com.ssafy.recode.domain.basic.entity.BasicAnswer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BasicAnswerRepository extends JpaRepository<BasicAnswer, Long> {

  /**
   * 해당 유저가 마지막으로 답변한 question_id 의 최대값을 가져옵니다. 아직 답변이 없으면 0을 리턴하도록 COALESCE 처리합니다.
   */
  @Query("SELECT COALESCE(MAX(b.questionId), 0) FROM BasicAnswer b WHERE b.userId = :userId")
  Long findMaxQuestionIdByUserId(@Param("userId") Long userId);

  /**
   * 기초 질문 답변 확인용
   * @param userId 사용자 아이디
   * @param start 당일 0시
   * @param end 당일 24시
   * @return true: 존재함, false: 없음
   */
  boolean existsByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

  public interface BasicVideoRow {
    Long getAnswerId();
    Long getQuestionId();
    String getContent();
    String getVideoPath();
    int getScore();
    boolean getIsMatch();
    LocalDateTime getCreatedAt();
  }

  @Query(value = """
        SELECT ba.answer_id AS answerId,
               bq.question_id AS questionId,
               bq.content AS content,
               ba.video_path  AS videoPath,
               ba.score AS score,
               ba.is_match AS isMatch,
               ba.created_at AS createdAt
         FROM basic_answers ba
         JOIN basic_questions bq 
           ON bq.question_id = ba.question_id
        WHERE ba.user_id = :userId
          AND ba.created_at >= DATE(:date)
          AND ba.created_at <  DATE(:date) + INTERVAL 1 DAY
        ORDER BY ba.created_at ASC
        """, nativeQuery = true)
  List<BasicVideoRow> findVideoPathsByDate(
      @Param("userId") Long userId,
      @Param("date") LocalDate dateR
  );
}
