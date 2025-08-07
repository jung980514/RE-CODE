package com.ssafy.recode.domain.survey.controller;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.survey.service.SurveyService;
import com.ssafy.recode.global.dto.request.BasicAnswerRequestDto;
import com.ssafy.recode.global.dto.request.survey.SurveyAnswerRequestDto;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.security.annotation.LoginUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/survey")
@Tag(name = "Survey", description = "일일 설문 질문 답변 저장 및 적합도 평가 API")
public class SurveyController {

  private final SurveyService surveyService;

  /**
   * 일일 설문 질문 조회
   * @return List
   */
  @GetMapping("/questions")
  public ResponseEntity<?> getQuestions() {
    return ResponseEntity.ok(
        ApiResponse.successResponse(
            surveyService.getTodaySurveyQuestions()
        )
    );
  }

  @PostMapping(
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE,
      path = "/answers"
  )
  @Operation(
      summary     = "일일 설문 질문 답변 제출",
      description = "1) 클라이언트가 업로드한 MP4 비디오 파일을 S3에 저장합니다.  \n"
          + "2) 저장된 영상을 STT로 텍스트 변환하고, DB에 저장합니다.",
      requestBody = @RequestBody(
          required = true,
          content  = @Content(
              mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
              schema    = @Schema(implementation = BasicAnswerRequestDto.class)
          )
      )
  )
  public ResponseEntity<?> submitAnswer(
      @LoginUser User user,
      @Valid @ModelAttribute SurveyAnswerRequestDto reqDto
  ) {
    // 1) MP4 파일을 S3에 업로드하고, 업로드된 파일의 키를 반환합니다.
    String mediaKey = surveyService.uploadMedia(reqDto.getVideoFile());

    // 2) 변환된 미디어 키와 함께 비동기 파이프라인(STT → 요약 → 유사도 계산 → DB 저장)을 실행합니다.
    surveyService.processAnswerAsync(
        reqDto.getQuestionId(),
        user.getId(),
        mediaKey
    );

    // 3) 즉시 200 OK 응답을 반환하여 클라이언트에 업로드 성공 및 저장 진행 중임을 알립니다.
    return ResponseEntity.ok(
        ApiResponse.successResponseWithMessage("업로드 완료, 답변 내용을 저장합니다.", null)
    );
  }
}
