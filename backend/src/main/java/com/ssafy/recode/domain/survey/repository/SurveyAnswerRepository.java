package com.ssafy.recode.domain.survey.repository;

import com.ssafy.recode.domain.survey.entity.SurveyAnswer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SurveyAnswerRepository extends JpaRepository<SurveyAnswer, Integer> {

    // ✅ native 결과 타입에 맞춘 Projection
    interface MonthlyCalendarRow {
        java.sql.Date getCalDate(); // DB DATE → java.sql.Date
        Integer getHasData();       // TINYINT(0/1) → Integer
    }

    /**
     *
     *오늘 하루 동안 해당 사용자의 답변이 존재하는지 확인
     *
     *@param userId 사용자 아이디
     *@param start 당일 0시
     *@param end 당일 24시
     *@return true: 존재함, false: 없음
     *
     */
    boolean existsByUserIdAndCreatedAtBetween(
            Long userId,
            LocalDateTime start,
            LocalDateTime end);

    // 특정 달에 해당 유저의 모든 답변 리스트 조회
    @Query(value = """
    WITH RECURSIVE date_range AS (
        SELECT DATE(:startDate) AS cal_date
        UNION ALL
        SELECT DATE_ADD(cal_date, INTERVAL 1 DAY)
        FROM date_range
        WHERE cal_date < LAST_DAY(:startDate)
    )
    SELECT 
        dr.cal_date,
        CASE WHEN sa.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS has_data
    FROM date_range dr
    LEFT JOIN survey_answers sa
        ON DATE(sa.created_at) = dr.cal_date
        AND sa.user_id = :userId
    ORDER BY dr.cal_date
    """, nativeQuery = true)
    List<MonthlyCalendarRow> findMonthlyCalendarWithFlags(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate
    );

}