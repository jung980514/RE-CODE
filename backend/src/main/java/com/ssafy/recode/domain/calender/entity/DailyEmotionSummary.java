package com.ssafy.recode.domain.calender.entity;

import com.ssafy.recode.global.enums.AnswerType;
import com.ssafy.recode.global.enums.Emotion;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "daily_emotion_summary",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_user_date_type",
            columnNames = {"user_id", "summary_date", "answer_type"}
        )
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DailyEmotionSummary {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "summary_id")
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "summary_date", nullable = false)
  private LocalDate summaryDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "answer_type", nullable = false, length = 32)
  private AnswerType answerType;

  @Enumerated(EnumType.STRING)
  @Column(name = "dominant_emotion", nullable = false, length = 32)
  private Emotion dominantEmotion;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

}
