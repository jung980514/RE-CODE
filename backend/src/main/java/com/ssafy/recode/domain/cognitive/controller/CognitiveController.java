package com.ssafy.recode.domain.cognitive.controller;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.cognitive.entity.CognitiveQuestion;
import com.ssafy.recode.domain.cognitive.service.CognitiveService;
import com.ssafy.recode.global.dto.request.AnswerRequestDto;
import com.ssafy.recode.global.dto.request.EmotionRequset;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.enums.AnswerType;
import com.ssafy.recode.global.security.annotation.LoginUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cognitive")
@Tag(name = "Cognitive", description = "인지 질문 API")
public class CognitiveController {

  private final CognitiveService cognitiveService;

  @Operation(
      summary     = "인지 질문 답변 제출 및 적합도 평가",
      description = "1) 클라이언트가 업로드한 비디오/오디오 파일을 S3에 저장합니다.\n"
          + "2) STT로 텍스트 변환하고,\n"
          + "3) 변환된 텍스트를 LLM에 전달하여 0~100점으로 적합도를 평가합니다.\n"
          + "4) 평가 점수가 임계치 이상이면 isMatch=true, 미만이면 false로 판단합니다.\n"
          + "5) 평가 점수(score), 적합 여부(isMatch), 원본 미디어 링크(mediaPath)를 함께 DB에 저장합니다.",
      requestBody = @RequestBody(
          required = true,
          content  = @Content(
              mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
              schema    = @Schema(implementation = AnswerRequestDto.class)
          )
      )
  )
  @PostMapping(
      path     = "/answers",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ApiResponse<?> submitCognitiveAnswer(
      @Parameter(hidden = true) @LoginUser User user,
      @Valid @ModelAttribute AnswerRequestDto reqDto
  ) {
    String mediaKey = cognitiveService.uploadMedia(reqDto.getVideoFile(), reqDto.getMediaType());
    cognitiveService.processAnswerAsync(
        reqDto.getQuestionId(),
        user.getId(),
        mediaKey,
        reqDto.getMediaType()
    );
    return ApiResponse.successResponseWithMessage(
        "업로드 완료, 백그라운드에서 평가를 진행합니다.", null
    );
  }

  @Operation(
      summary = "인지 질문 조회(타입별)",
      description = "mediaType('audio'|'image') 기준으로, 유저가 마지막으로 답한 question_id 이후부터 3개를 반환합니다."
  )
  @GetMapping(
      path = "/questions/{mediaType}",
      produces = MediaType.APPLICATION_JSON_VALUE
  )
  public ApiResponse<?> getQuestionsByType(
      @Parameter(hidden = true) @LoginUser User user,
      @PathVariable String mediaType
  ) {
    List<CognitiveQuestion> questions =
        cognitiveService.getNextQuestionsByType(user.getId(), mediaType);
    return ApiResponse.successResponse(questions);
  }

  @PostMapping("/emotions")
  public ResponseEntity<?> addEmotions(
      @Parameter(hidden = true) @LoginUser User user,
      @ModelAttribute EmotionRequset requset,
      @RequestParam AnswerType answerType
  ){
    cognitiveService.addEmotions(user,requset,answerType);
    return ResponseEntity.ok(ApiResponse.successResponseWithMessage("", null));
  }
}
