package com.ssafy.recode.domain.calendar.repository;

import com.ssafy.recode.domain.calendar.dto.CalendarEmotionDTO;
import com.ssafy.recode.domain.calendar.dto.DailyDetailDTO;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Calendar 전용 커스텀 리포지토리 구현체
 */
@Repository
@RequiredArgsConstructor
public class CalendarRepositoryImpl implements CalendarRepository {

    private final EntityManager em;

    private static final String MONTHLY_SQL = """
        SELECT date, basic_emotion, personal_emotion, cognitive_emotion
        FROM (
            SELECT DATE(b.created_at) AS date, b.emotion AS basic_emotion, NULL       AS personal_emotion, NULL            AS cognitive_emotion
            FROM basic_answers b
            WHERE b.user_id = :userId AND b.created_at >= :start AND b.created_at < :end
          UNION ALL
            SELECT DATE(p.created_at) AS date, NULL,       p.emotion,             NULL
            FROM personal_answers p
            WHERE p.user_id = :userId AND p.created_at >= :start AND p.created_at < :end
          UNION ALL
            SELECT DATE(c.created_at) AS date, NULL,       NULL,                   c.emotion
            FROM cognitive_answers c
            WHERE c.user_id = :userId AND c.created_at >= :start AND c.created_at < :end
        ) t
        ORDER BY date
    """;

    @Override
    @Transactional(readOnly = true)
    public List<CalendarEmotionDTO> findMonthlyEmotions(Long userId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end   = endDate.plusDays(1).atStartOfDay();

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(MONTHLY_SQL)
                .setParameter("userId", userId)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();

        // TreeMap 으로 정렬 보장
        Map<LocalDate, CalendarEmotionDTO> map = new TreeMap<>();
        for (Object[] row : rows) {
            LocalDate date = ((Date) row[0]).toLocalDate();
            CalendarEmotionDTO dto = map.computeIfAbsent(date,
                    d -> new CalendarEmotionDTO(d, null, null, null));

            Optional.ofNullable(row[1]).map(Object::toString).ifPresent(dto::setBasicEmotion);
            Optional.ofNullable(row[2]).map(Object::toString).ifPresent(dto::setPersonalEmotion);
            Optional.ofNullable(row[3]).map(Object::toString).ifPresent(dto::setCognitiveEmotion);
        }

        return new ArrayList<>(map.values());
    }

    @Override
    @Transactional(readOnly = true)
    public DailyDetailDTO findDailyDetail(Long userId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end   = start.plusDays(1);

        DailyDetailDTO.DailyDetailDTOBuilder builder = DailyDetailDTO.builder()
                .date(date);

        // 기본/개인/인지 답변 각각 조회 및 빌더에 세팅
        applyDetail(builder, getSingle("basic_answers",   userId, start, end,
                        "basic_questions",   "q.content", "a.answer", "a.score", "a.emotion", "a.video_path"),
                this::applyBasic);

        applyDetail(builder, getSingle("personal_answers", userId, start, end,
                        "personal_questions", "q.content", "a.answer", "a.score", "a.emotion", "a.video_path"),
                this::applyPersonal);

        applyDetail(builder, getSingle("cognitive_answers", userId, start, end,
                        "cognitive_questions","q.content","a.answer","a.score","a.emotion","a.video_path","a.media_type"),
                this::applyCognitive);

        return builder.build();
    }

    /**
     * 단일 조회 쿼리 수행
     */
    private Object[] getSingle(String answerTable, Long userId,
                               LocalDateTime start, LocalDateTime end,
                               String questionTable, String... columns) {
        String columnList = String.join(", ", columns);
        String sql = String.format("""
            SELECT %s
            FROM %s a
            JOIN %s q ON a.question_id = q.question_id
            WHERE a.user_id = :userId AND a.created_at >= :start AND a.created_at < :end
            LIMIT 1
        """, columnList, answerTable, questionTable);

        @SuppressWarnings("unchecked")
        List<Object[]> list = em.createNativeQuery(sql)
                .setParameter("userId", userId)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultList();

        return list.isEmpty() ? null : list.get(0);
    }

    private void applyDetail(DailyDetailDTO.DailyDetailDTOBuilder builder,
                             Object[] data,
                             DetailApplier applier) {
        if (data != null) {
            applier.apply(builder, data);
        }
    }

    // 기본 답변 매핑
    private void applyBasic(DailyDetailDTO.DailyDetailDTOBuilder b, Object[] d) {
        b.basicQuestion(    (String) d[0])
                .basicAnswer(      (String) d[1])
                .basicScore(       ((Number) d[2]).doubleValue())
                .basicEmotion(     (String) d[3])
                .basicVideoPath(   (String) d[4]);
    }

    // 개인 답변 매핑
    private void applyPersonal(DailyDetailDTO.DailyDetailDTOBuilder b, Object[] d) {
        b.personalQuestion(  (String) d[0])
                .personalAnswer(    (String) d[1])
                .personalScore(     ((Number) d[2]).doubleValue())
                .personalEmotion(   (String) d[3])
                .personalVideoPath( (String) d[4]);
    }

    // 인지 답변 매핑
    private void applyCognitive(DailyDetailDTO.DailyDetailDTOBuilder b, Object[] d) {
        b.cognitiveQuestion(  (String) d[0])
                .cognitiveAnswer(    (String) d[1])
                .cognitiveScore(     ((Number) d[2]).doubleValue())
                .cognitiveEmotion(   (String) d[3])
                .cognitiveVideoPath( (String) d[4])
                .cognitiveMediaType( (String) d[5]);
    }

    @FunctionalInterface
    private interface DetailApplier {
        void apply(DailyDetailDTO.DailyDetailDTOBuilder builder, Object[] data);
    }
}
