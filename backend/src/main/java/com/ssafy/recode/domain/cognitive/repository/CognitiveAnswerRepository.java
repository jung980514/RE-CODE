package com.ssafy.recode.domain.cognitive.repository;

import com.ssafy.recode.domain.cognitive.entity.CognitiveAnswer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CognitiveAnswerRepository extends JpaRepository<CognitiveAnswer, Long> {
  /**
   * 해당 유저가 마지막으로 답변한 해당 mediaType의 question_id 의 최대값을 가져옵니다.
   * 아직 답변이 없으면 0을 리턴하도록 COALESCE 처리합니다.
   */
  @Query("SELECT COALESCE(MAX(c.question.questionId), 0) " +
        "FROM CognitiveAnswer c " +
        "WHERE c.userId = :userId AND c.mediaType = :mediaType")
  Long findMaxQuestionIdByUserIdAndMediaType(@Param("userId") Long userId,
      @Param("mediaType") String mediaType);

  /**
   * 당일 인지 질문 답변 확인 용
   * @param userId 사용자 아이디
   * @param start 당일 0시
   * @param end 당일 24시
   * @param mediaType 질문 종류. 음성 : audio, 사진: image
   * @return true: 존재함, false: 없음
   */
  boolean existsByUserIdAndCreatedAtBetweenAndMediaType(Long userId, LocalDateTime start, LocalDateTime end, String mediaType);

  public interface CognitiveVideoRow {
    Long getAnswerId();
    Long getQuestionId();
    String getContent();
    String getVideoPath();
    int getScore();
    boolean getIsMatch();
    LocalDateTime getCreatedAt();
  }

  @Query(value = """
        SELECT ca.answer_id AS answerId,
               cq.question_id AS questionId,
               cq.content AS content,
               ca.video_path  AS videoPath,
               ca.score AS score,
               ca.is_match AS isMatch,
               ca.created_at AS createdAt
         FROM cognitive_answers ca
         JOIN cognitive_questions cq 
           ON cq.question_id = ca.question_id
          AND cq.media_type = :mediaType
        WHERE ca.user_id = :userId
          AND ca.created_at >= DATE(:date)
          AND ca.created_at <  DATE(:date) + INTERVAL 1 DAY
        ORDER BY ca.created_at ASC
        """, nativeQuery = true)
  List<CognitiveVideoRow> findVideoPathsByDate(
      @Param("userId") Long userId,
      @Param("date") LocalDate dateR,
      @Param("mediaType") String mediaType
  );

}
