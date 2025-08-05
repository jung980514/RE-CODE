package com.ssafy.recode.domain.cognitive.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 인지 회상 훈련용 질문 엔티티
 */
@Entity
@Table(name = "cognitive_questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CognitiveQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long questionId;

    /** 질문 내용 */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** 미디어(URL) */
    @Column(name = "media_url", length = 255)
    private String mediaUrl;

    /** 미디어 타입(audio | image) */
    @Column(name = "media_type", columnDefinition = "ENUM('audio','image')")
    private String mediaType;

    /** 생성일시 */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
