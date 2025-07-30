package com.ssafy.recode.domain.basic.controller;

import com.ssafy.recode.domain.basic.service.BasicAnswerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/answers/basic")
@Tag(name = "BasicAnswer", description = "기초 질문 답변 저장 및 적합도 평가 API")
public class BasicAnswerController {

  private final BasicAnswerService basicAnswerService;

  /**
   * MP4 파일을 받아 WAV로 변환·S3 업로드 후,
   * 비동기 파이프라인(STT → 요약 → 유사도 → 저장)을 실행합니다.
   *
   * @param questionId  basic_questions 테이블의 질문 ID
   * @param userId      요청한 사용자 ID
   * @param videoFile   업로드할 MP4 파일
   * @return 평가 요청 수락 메시지
   */
  @PostMapping
  @Operation(
      summary = "기본 답변 제출",
      description = "MP4 비디오 파일을 받아 WAV로 변환하고 S3에 업로드한 뒤, 비동기 평가 파이프라인을 실행합니다."
  )
  public ResponseEntity<String> submitAnswer(
      @Parameter(description = "basic_questions 테이블의 질문 ID", required = true)
      @RequestParam Long questionId,

      @Parameter(description = "요청한 사용자 ID", required = true)
      @RequestParam Long userId,

      @Parameter(description = "업로드할 MP4 파일", required = true, schema = @io.swagger.v3.oas.annotations.media.Schema(type = "string", format = "binary"))
      @RequestParam("videoFile") MultipartFile videoFile
  ) {
    // 1) MP4 → WAV 변환 후 S3 업로드
    String wavKey = basicAnswerService.uploadVideoAsWav(videoFile);

    // 2) 비동기 처리 실행 (STT → 요약 → 유사도 → DB 저장)
    basicAnswerService.processAnswerAsync(questionId, userId, wavKey);

    // 3) 즉시 200 OK 반환 (실제 작업은 백그라운드)
    return ResponseEntity.ok("업로드 완료, 평가를 진행 중입니다.");
  }
}
