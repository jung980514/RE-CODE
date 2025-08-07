package com.ssafy.recode.global.dto.response.survey;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SurveyQAResponse {

  private final Long questionId;
  private final String questionContent;
  private final String answerContent;
  private final LocalDateTime answeredAt;
}
