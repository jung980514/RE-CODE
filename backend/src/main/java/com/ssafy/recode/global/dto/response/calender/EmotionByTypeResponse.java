package com.ssafy.recode.global.dto.response.calender;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EmotionByTypeResponse {

  private Long userId;
  private LocalDate summaryDate;
  private String answerType;        // BASIC / PERSONAL / COGNITIVE_AUDIO / COGNITIVE_IMAGE
  private String dominantEmotion;   // 없으면 null
  private LocalDateTime createdAt;  // 없으면 null
}