package com.ssafy.recode.domain.basic.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "basic_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BasicAnswer {

  /** primary key */
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "answer_id")
  private Long answerId;

  /** 질문 테이블 FK */
  @Column(name = "question_id", nullable = false)
  private Long questionId;

  /** 사용자 ID */
  @Column(name = "user_id", nullable = false)
  private Long userId;

  /** STT로 변환된 원문 텍스트 (매우 길어질 수 있으므로 Lob/Text) */
  @Lob
  @Column(name = "answer", columnDefinition = "TEXT", nullable = false)
  private String sttText;

  /** 요약문 또는 키워드 텍스트 */
  @Lob
  @Column(name = "keywords", columnDefinition = "TEXT")
  private String keywords;

  /** 코사인 유사도 점수 */
  @Column(name = "score")
  private Double score;

  /** 유사도 임계치(match) 여부 */
  @Builder.Default
  @Column(name = "is_match", nullable = false)
  private Boolean isMatch = false;

  /** S3에 저장된 비디오 경로(키) */
  @Column(name = "video_path", length = 255, nullable = false)
  private String videoPath;

  /** 생성 시각 (insert 시점에 자동으로 채워짐) */
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
