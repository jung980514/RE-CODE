package com.ssafy.recode.domain.calender.repository;

import com.ssafy.recode.domain.calender.entity.DailyEmotionSummary;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * DailyEmotionSummaryRepository
 *
 * 회상 캘린더
 *
 * @author 김영민
 * @since 2025. 8. 11
 */
public interface DailyEmotionSummaryRepository extends JpaRepository<DailyEmotionSummary, Long> {

  @Query(value = """
        WITH answer_types AS (
            SELECT 'BASIC' AS answer_type
            UNION ALL SELECT 'PERSONAL'
            UNION ALL SELECT 'COGNITIVE_AUDIO'
            UNION ALL SELECT 'COGNITIVE_VIDEO'
        ),
        single_date AS (                       
              SELECT DATE(:date) AS summary_date
        ),
        latest AS (
            SELECT
                user_id,
                summary_date,
                answer_type,
                dominant_emotion,
                created_at,
                ROW_NUMBER() OVER (PARTITION BY answer_type ORDER BY created_at DESC) AS rn
            FROM daily_emotion_summary
            WHERE user_id = :userId
              AND summary_date = :date
        )
        SELECT
            :userId            AS userId,
            sd.summary_date    AS summaryDate,
            t.answer_type      AS answerType,
            l.dominant_emotion AS dominantEmotion,
            l.created_at       AS createdAt
        FROM answer_types t
       CROSS JOIN single_date sd
        LEFT JOIN latest l
          ON l.answer_type = t.answer_type AND l.rn = 1
        ORDER BY FIELD(t.answer_type,'BASIC','PERSONAL','COGNITIVE_AUDIO','COGNITIVE_VIDEO')
        """, nativeQuery = true)
  List<Object[]> findEmotionByDatePerTypeRaw(
      @Param("userId") Long userId,
      @Param("date") LocalDate date
  );
}
