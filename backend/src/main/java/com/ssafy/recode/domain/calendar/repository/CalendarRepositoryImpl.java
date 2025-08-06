package com.ssafy.recode.domain.calendar.repository;

import com.ssafy.recode.domain.calendar.dto.CalendarEmotionDTO;
import com.ssafy.recode.domain.calendar.dto.DailyDetailDTO;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class CalendarRepositoryImpl implements CalendarRepository {

    private final EntityManager em;

    @Override
    @Transactional(readOnly = true)
    public List<CalendarEmotionDTO> findMonthlyEmotions(Long userId, LocalDate startDate, LocalDate endDate) {
        String sql = """
            SELECT DATE(b.created_at) AS date, b.emotion AS basicEmotion, NULL AS personalEmotion, NULL AS cognitiveEmotion
            FROM basic_answers b
            WHERE b.user_id = :userId AND b.created_at BETWEEN :start AND :end

            UNION ALL

            SELECT DATE(p.created_at), NULL, p.emotion, NULL
            FROM personal_answers p
            WHERE p.user_id = :userId AND p.created_at BETWEEN :start AND :end

            UNION ALL

            SELECT DATE(c.created_at), NULL, NULL, c.emotion
            FROM cognitive_answers c
            WHERE c.user_id = :userId AND c.created_at BETWEEN :start AND :end
        """;

        List<Object[]> result = em.createNativeQuery(sql)
                .setParameter("userId", userId)
                .setParameter("start", startDate.atStartOfDay())
                .setParameter("end", endDate.plusDays(1).atStartOfDay())
                .getResultList();

        // 날짜별로 병합
        Map<LocalDate, CalendarEmotionDTO> map = new HashMap<>();
        for (Object[] row : result) {
            LocalDate date = ((java.sql.Date) row[0]).toLocalDate();
            map.putIfAbsent(date, new CalendarEmotionDTO(date, null, null, null));
            CalendarEmotionDTO dto = map.get(date);
            if (row[1] != null) dto.setBasicEmotion((String) row[1]);
            if (row[2] != null) dto.setPersonalEmotion((String) row[2]);
            if (row[3] != null) dto.setCognitiveEmotion((String) row[3]);
        }

        return new ArrayList<>(map.values());
    }

    @Override
    @Transactional(readOnly = true)
    public DailyDetailDTO findDailyDetail(Long userId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        // 각각 첫 번째 기록만 조회
        Object[] basic = getSingleResult("""
        SELECT q.content, a.answer, a.score, a.emotion, a.video_path
        FROM basic_answers a
        JOIN basic_questions q ON a.question_id = q.question_id
        WHERE a.user_id = :userId AND a.created_at BETWEEN :start AND :end
        LIMIT 1
    """, userId, start, end);

        Object[] personal = getSingleResult("""
        SELECT q.content, a.answer, a.score, a.emotion, a.video_path
        FROM personal_answers a
        JOIN personal_questions q ON a.question_id = q.question_id
        WHERE a.user_id = :userId AND a.created_at BETWEEN :start AND :end
        LIMIT 1
    """, userId, start, end);

        Object[] cognitive = getSingleResult("""
        SELECT q.content, a.answer, a.score, a.emotion, a.video_path, a.media_type
        FROM cognitive_answers a
        JOIN cognitive_questions q ON a.question_id = q.question_id
        WHERE a.user_id = :userId AND a.created_at BETWEEN :start AND :end
        LIMIT 1
    """, userId, start, end);

        return DailyDetailDTO.builder()
                .date(date)
                .basicQuestion(basic != null ? (String) basic[0] : null)
                .basicAnswer(basic != null ? (String) basic[1] : null)
                .basicScore(basic != null ? (Double) basic[2] : null)
                .basicEmotion(basic != null ? (String) basic[3] : null)
                .basicVideoPath(basic != null ? (String) basic[4] : null)

                .personalQuestion(personal != null ? (String) personal[0] : null)
                .personalAnswer(personal != null ? (String) personal[1] : null)
                .personalScore(personal != null ? (Double) personal[2] : null)
                .personalEmotion(personal != null ? (String) personal[3] : null)
                .personalVideoPath(personal != null ? (String) personal[4] : null)

                .cognitiveQuestion(cognitive != null ? (String) cognitive[0] : null)
                .cognitiveAnswer(cognitive != null ? (String) cognitive[1] : null)
                .cognitiveScore(cognitive != null ? (Double) cognitive[2] : null)
                .cognitiveEmotion(cognitive != null ? (String) cognitive[3] : null)
                .cognitiveVideoPath(cognitive != null ? (String) cognitive[4] : null)
                .cognitiveMediaType(cognitive != null ? (String) cognitive[5] : null)
                .build();
    }

    private Object[] getSingleResult(String sql, Long userId, LocalDateTime start, LocalDateTime end) {
        List<Object[]> result = em.createNativeQuery(sql)
                .setParameter("userId", userId)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();

        return result.isEmpty() ? null : result.get(0);
    }

}
