package com.ssafy.recode.global.dto.response.calendar;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor   // (선택) 역직렬화 필요시
@AllArgsConstructor
public class VideoUrlItem {
  private Long answerId;  // 답변 ID
  private Long questionId;
  private String content;
  private String url;     // Presigned URL
  private int score;
  private boolean isMatch;
  private LocalDateTime createdAt;
}