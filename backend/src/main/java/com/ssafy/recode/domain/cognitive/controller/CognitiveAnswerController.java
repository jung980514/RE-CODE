package com.ssafy.recode.domain.cognitive.controller;

import com.ssafy.recode.global.dto.request.CognitiveAnswerRequestDto;
import com.ssafy.recode.global.dto.response.BasicAnswerResponseDto;
import com.ssafy.recode.domain.cognitive.service.CognitiveAnswerService;
import com.ssafy.recode.global.dto.response.CognitiveAnswerResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.*;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/answers/cognitive")
@Tag(name = "CognitiveAnswer", description = "인지 회상 훈련 답변 저장 및 평가 API")
public class CognitiveAnswerController {

    private final CognitiveAnswerService answerService;

    @PostMapping(
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    @Operation(
        summary     = "인지 회상 훈련 답변 제출 및 비동기 처리",
        description = """
            요청 DTO의 mediaType 필드로 오디오/이미지를 구분합니다.
            1) mediaType="audio" → MP4→WAV 변환 후 S3 업로드  
            2) mediaType="image" → 이미지 파일 바로 S3 업로드  
            3) audio인 경우 STT 전사, image인 경우 파일 URL 그대로 LLM에 전달  
            4) 0~100 점수로 평가 후 match 여부 판단  
            5) BasicAnswer 엔티티에 score, isMatch, mediaPath(mediaKey), mediaType 저장  
            """,
        requestBody = @RequestBody(
            required = true,
            content = @Content(
                mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                schema = @Schema(implementation = CognitiveAnswerRequestDto.class)
            )
        )
    )
    public ResponseEntity<CognitiveAnswerResponseDto> submit(
        @Valid @ModelAttribute CognitiveAnswerRequestDto reqDto
    ) {
      // 1) 파일 업로드 (폴더는 건드릴 필요 없이 mediaType으로 구분)
      String wavKey = answerService.uploadMedia(reqDto.getVideoFile(), reqDto.getMediaType());

      // 2) 비동기 STT→평가→저장
      answerService.processAnswerAsync(
          reqDto.getQuestionId(),
          reqDto.getUserId(),
          wavKey,
          reqDto.getMediaType()
      );

      // 3) 즉시 응답
      return ResponseEntity.ok(
          new CognitiveAnswerResponseDto("업로드 완료, 백그라운드에서 평가를 진행합니다.")
      );
    }
}
