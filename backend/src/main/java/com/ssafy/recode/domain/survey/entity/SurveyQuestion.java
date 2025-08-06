package com.ssafy.recode.domain.survey.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "survey_questions", uniqueConstraints = {
    @UniqueConstraint(name = "uq_content", columnNames = "content")
})
public class SurveyQuestion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long questionId;

  @Column(columnDefinition = "TEXT", nullable = false)
  private String content;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  @Builder
  public SurveyQuestion(String content) {
    LocalDateTime now = LocalDateTime.now();
    this.content = content;
    this.createdAt = now;
  }

}
