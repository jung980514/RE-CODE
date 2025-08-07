package com.ssafy.recode.domain.cognitive.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 인지 회상 훈련 답변 엔티티
 */
@Entity
@Table(name = "cognitive_answers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CognitiveAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "answer_id")
    private Long answerId;

    /** 어떤 질문에 대한 답변인지 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id")
    private CognitiveQuestion question;

    /** 답변자(사용자) ID */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 전사된 텍스트 답변 */
    @Column(columnDefinition = "TEXT")
    private String answer;

    /** 평가 점수(0~100) */
    private double score;

    /** 적합 여부 (0|1) */
    @Column(name = "is_match")
    private boolean isMatch;

    /** 저장된 비디오(mp4) 경로 */
    @Column(name = "video_path", nullable = false, length = 255)
    private String videoPath;

    /** 미디어 타입(audio | image) */
    @Column(name = "media_type", columnDefinition = "ENUM('audio','image')")
    private String mediaType;

    /** 생성일시 */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
