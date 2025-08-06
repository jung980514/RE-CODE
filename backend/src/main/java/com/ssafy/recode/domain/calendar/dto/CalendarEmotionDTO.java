package com.ssafy.recode.domain.calendar.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "월간 감정 DTO (캘린더용)")
public class CalendarEmotionDTO {

    @Schema(description = "날짜 (YYYY-MM-DD)", example = "2025-08-06")
    private LocalDate date;

    @Schema(description = "기초 질문 감정", example = "HAPPY")
    private String basicEmotion;

    @Schema(description = "개인화 질문 감정", example = "SAD")
    private String personalEmotion;

    @Schema(description = "인지 질문 감정", example = "NEUTRAL")
    private String cognitiveEmotion;
}
