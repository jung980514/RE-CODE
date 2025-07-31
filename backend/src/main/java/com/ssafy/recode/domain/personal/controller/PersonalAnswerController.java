package com.ssafy.recode.domain.personal.controller;

import com.ssafy.recode.domain.personal.service.PersonalAnswerService;
import com.ssafy.recode.global.dto.request.PersonalAnswerRequestDto;
import com.ssafy.recode.global.dto.response.PersonalAnswerResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/answers/personal")
@Tag(name = "PersonalAnswer", description = "개인화 질문 답변 저장 및 적합도 평가 API")
public class PersonalAnswerController {

  private final PersonalAnswerService personalAnswerService;

  @PostMapping(
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  @Operation(
      summary     = "개인화 질문 답변 제출 및 적합도 평가",
      description = "1) 클라이언트가 업로드한 MP4 비디오 파일을 WAV로 변환 후 S3에 저장합니다.  \n"
          + "2) 저장된 WAV를 STT로 텍스트 변환하고,  \n"
          + "3) 변환된 텍스트를 LLM에 전달하여 0~100점으로 “질문에 대한 답변 적합도”를 평가합니다.  \n"
          + "4) 평가 점수가 임계값(예: 70) 이상이면 적합(true), 미만이면 부적합(false)으로 판단하고,  \n"
          + "5) 평가 점수(score), 적합 여부(isMatch), 원본 MP4 링크(videoPath)를 함께 DB에 저장합니다.",
      requestBody = @RequestBody(
          required = true,
          content  = @Content(
              mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
              schema    = @Schema(implementation = PersonalAnswerRequestDto.class)
          )
      )
  )
  public ResponseEntity<PersonalAnswerResponseDto> submitAnswer(
      @Valid @ModelAttribute PersonalAnswerRequestDto reqDto
  ) {
    // 1) MP4 파일을 WAV로 변환한 뒤 S3에 업로드하고, 업로드된 WAV 파일의 키를 반환합니다.
    String wavKey = personalAnswerService.uploadVideoAsWav(reqDto.getVideoFile());

    // 2) 변환된 WAV 키와 함께 비동기 파이프라인(STT → 요약 → 유사도 계산 → DB 저장)을 실행합니다.
    personalAnswerService.processAnswerAsync(
        reqDto.getQuestionId(),
        reqDto.getUserId(),
        wavKey
    );

    // 3) 즉시 200 OK 응답을 반환하여 클라이언트에 업로드 성공 및 평가 진행 중임을 알립니다.
    return ResponseEntity.ok(
        new PersonalAnswerResponseDto("개인화 질문 답변 업로드 완료, 평가를 진행 중입니다.")
    );
  }
}
