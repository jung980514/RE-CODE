package com.ssafy.recode.domain.personal.repository;

import com.ssafy.recode.domain.personal.entity.PersonalAnswer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

  public interface PersonalVideoRow {
    Long getAnswerId();
    Long getQuestionId();
    String getContent();
    String getVideoPath();
    int getScore();
    boolean getIsMatch();
    LocalDateTime getCreatedAt();
  }

  @Query(value = """
        SELECT pa.answer_id AS answerId,
               pq.question_id AS questionId,
               pq.content AS content,
               pa.video_path  AS videoPath,
               pa.score AS score,
               pa.is_match AS isMatch,
               pa.created_at AS createdAt
        FROM personal_answers pa
        JOIN personal_questions pq
          ON pq.question_id = pa.question_id
        WHERE pa.user_id = :userId
          AND pa.created_at >= DATE(:date)
          AND pa.created_at <  DATE(:date) + INTERVAL 1 DAY
        ORDER BY pa.created_at ASC
        """, nativeQuery = true)
  List<PersonalVideoRow> findVideoPathsByDate(
      @Param("userId") Long userId,
      @Param("date") LocalDate date
  );
}
