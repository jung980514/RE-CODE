package com.ssafy.recode.domain.personal.controller;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.personal.entity.PersonalQuestion;
import com.ssafy.recode.domain.personal.service.PersonalService;
import com.ssafy.recode.global.dto.request.AnswerRequestDto;
import com.ssafy.recode.global.dto.request.EmotionRequset;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.security.annotation.LoginUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/personal")
@Tag(name = "Personal", description = "개인화 질문 API")
public class PersonalController {

  private final PersonalService personalService;

  @PostMapping(
      path     = "/answers",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  @Operation(
      summary     = "개인화 질문 답변 제출 및 적합도 평가",
      description = "1) 클라이언트가 업로드한 MP4 비디오 파일을 S3에 저장합니다.  \n"
          + "2) STT로 텍스트 변환하고,  \n"
          + "3) 변환된 텍스트를 LLM에 전달하여 0~100점으로 “질문에 대한 답변 적합도”를 평가합니다.  \n"
          + "4) 평가 점수가 임계값(예: 70) 이상이면 적합(true), 미만이면 부적합(false)으로 판단하고,  \n"
          + "5) 평가 점수(score), 적합 여부(isMatch), 원본 MP4 링크(videoPath)를 함께 DB에 저장합니다.",
      requestBody = @RequestBody(
          required = true,
          content  = @Content(
              mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
              schema    = @Schema(implementation = AnswerRequestDto.class)
          )
      )
  )
  public ApiResponse<?> submitAnswer(
      @Parameter(hidden = true) @LoginUser User user,
      @Valid @ModelAttribute AnswerRequestDto dto
  ) {
    String wavKey = personalService.uploadMedia(dto.getVideoFile());
    personalService.processAnswerAsync(
        dto.getQuestionId(),
        user.getId(),
        wavKey
    );
    return ApiResponse.successResponseWithMessage(
        "개인화 질문 답변 업로드 완료, 평가를 진행 중입니다.", null
    );
  }

  @Operation(
      summary     = "개인화 질문 조회",
      description = "유저가 마지막으로 답변한 questionId 이후부터 3개씩 순차 조회합니다. "
          + "답변이 한 번도 없으면 처음 3개, 끝까지 다 읽었으면 처음부터 다시 제공합니다."
  )
  @GetMapping(
      path     = "/questions",
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ApiResponse<?> getQuestions(
      @Parameter(hidden = true) @LoginUser User user
  ) {
    List<PersonalQuestion> questions =personalService.getNextQuestions(user.getId());
    return ApiResponse.successResponse(questions);
  }

  @PostMapping("/emotions")
  public ResponseEntity<?> addEmotions(
      @Parameter(hidden = true) @LoginUser User user,
      @org.springframework.web.bind.annotation.RequestBody EmotionRequset requset
  ){
    personalService.addEmotions(user, requset);
    return ResponseEntity.ok(ApiResponse.successResponseWithMessage("", null));
  }
}
