package com.ssafy.recode.domain.personal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "personal_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalAnswer {

  /** primary key */
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "answer_id", updatable = false)
  private Long answerId;

  /** 질문 테이블 FK */
  @Column(name = "question_id", nullable = false)
  private Long questionId;

  /** 사용자 ID */
  @Column(name = "user_id", nullable = false)
  private Long userId;

  /** STT로 변환된 원문 텍스트 */
  @Lob
  @Column(name = "answer", columnDefinition = "TEXT", nullable = false)
  private String answer;

  /** 코사인 유사도 점수 */
  @Column(name = "score")
  private Double score;

  /** 유사도 임계치(match) 여부 */
  @Column(name = "is_match", nullable = false)
  @Builder.Default
  private Boolean isMatch = false;

  /** S3에 저장된 비디오 경로(키) */
  @Column(name = "video_path", length = 255, nullable = false)
  private String videoPath;

  /** 생성 시각 (insert 시점에 자동으로 채워짐) */
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
