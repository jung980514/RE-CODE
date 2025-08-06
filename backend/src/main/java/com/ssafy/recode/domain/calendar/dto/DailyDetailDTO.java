package com.ssafy.recode.domain.calendar.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "일일 질문/답변 상세 DTO")
public class DailyDetailDTO {
    @Schema(description = "날짜", example = "2025-08-06")
    private LocalDate date;

    // Basic
    private String basicQuestion;
    private String basicAnswer;
    private Double basicScore;
    private String basicEmotion;
    private String basicVideoPath;

    // Personal
    private String personalQuestion;
    private String personalAnswer;
    private Double personalScore;
    private String personalEmotion;
    private String personalVideoPath;

    // Cognitive
    private String cognitiveQuestion;
    private String cognitiveAnswer;
    private Double cognitiveScore;
    private String cognitiveEmotion;
    private String cognitiveVideoPath;
    private String cognitiveMediaType;
}
