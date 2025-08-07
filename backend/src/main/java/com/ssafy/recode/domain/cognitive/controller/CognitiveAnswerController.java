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
        summary     = "인지 질문 답변 제출 및 적합도 평가",
        description = "1) 클라이언트가 업로드한 MP4 비디오 파일을 S3에 저장합니다.  \n"
            + "2) STT로 텍스트 변환하고,  \n"
            + "3) 변환된 텍스트를 LLM에 전달하여 0~100점으로 “질문에 대한 답변 적합도”를 평가합니다.  \n"
            + "4) 평가 점수가 임계값(예: 70) 이상이면 적합(true), 미만이면 부적합(false)으로 판단하고,  \n"
            + "5) 평가 점수(score), 적합 여부(isMatch), 원본 MP4 링크(videoPath)를 함께 DB에 저장합니다.",
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
