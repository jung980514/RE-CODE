package com.ssafy.recode.domain.basic.controller;

import com.ssafy.recode.domain.basic.service.BasicAnswerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController                                         // REST API 컨트롤러
@RequiredArgsConstructor                               // final 필드 생성자 자동 생성
@RequestMapping("/api/answers/basic")                         // URL 매핑 (필요시 변경 가능)
public class BasicAnswerController {

  private final BasicAnswerService basicAnswerService;  // 비즈니스 로직 서비스

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
  public ResponseEntity<String> submitAnswer(
      @RequestParam Long questionId,
      @RequestParam Long userId,
      @RequestParam MultipartFile videoFile
  ) {
    // 1) MP4 → WAV 변환 후 S3 업로드
    String wavKey = basicAnswerService.uploadVideoAsWav(videoFile);

    // 2) 비동기 처리 실행 (STT → 요약 → 유사도 → DB 저장)
    basicAnswerService.processAnswerAsync(questionId, userId, wavKey);

    // 3) 즉시 200 OK 반환 (실제 작업은 백그라운드)
    return ResponseEntity.ok("업로드 완료, 평가를 진행 중입니다.");
  }
}
