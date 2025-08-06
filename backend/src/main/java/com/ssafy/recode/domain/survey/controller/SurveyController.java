package com.ssafy.recode.domain.survey.controller;

import com.ssafy.recode.domain.survey.service.SurveyService;
import com.ssafy.recode.global.dto.request.PersonalAnswerRequestDto;
import com.ssafy.recode.global.dto.response.PersonalAnswerResponseDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/survey")
@Tag(name = "Survey", description = "일일 설문 질문 답변 저장 및 적합도 평가 API")
public class SurveyController {

  private final SurveyService surveyService;

  @GetMapping("/questions")
  public ResponseEntity<?> getQuestions(
      @Valid @ModelAttribute PersonalAnswerRequestDto reqDto
  ) {

    return ResponseEntity.ok(
        new PersonalAnswerResponseDto("개인화 질문 답변 업로드 완료, 평가를 진행 중입니다.")
    );
  }
}
