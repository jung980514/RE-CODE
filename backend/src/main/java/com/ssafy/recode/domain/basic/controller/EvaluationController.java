package com.ssafy.recode.domain.basic.controller;

import com.ssafy.recode.domain.basic.service.SummarizationService;
import com.ssafy.recode.domain.basic.service.SimilarityService;
import com.ssafy.recode.domain.basic.service.VideoTranscriptionService;
import com.ssafy.recode.domain.basic.repository.BasicQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * EvaluationController는 S3에 저장된 동영상을 STT 처리한 후,
 * 요약된 텍스트로 질문과의 코사인 유사도를 계산하여 결과를 반환합니다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/evaluate")
public class EvaluationController {

  /** S3에 저장된 기본 파일명 (fileName 미전달 시 사용) */
  private static final String DEFAULT_FILE_NAME = "hello.mp4";

  private final VideoTranscriptionService transcriptionService;
  private final SummarizationService summarizationService;
  private final SimilarityService similarityService;
  private final BasicQuestionRepository questionRepository;

  /**
   * 동영상 STT → 요약 → 질문과 유사도 평가 API
   *
   * @param questionId 평가할 질문 ID
   * @param fileName   (Optional) S3에 저장된 동영상 키, 기본 hello.mp4
   * @return JSON {
   *   "text": "STT 원문 텍스트",
   *   "summary": "요약된 텍스트",
   *   "score": 0.82,
   *   "match": true
   * }
   */
  @GetMapping
  public ResponseEntity<Map<String,Object>> evaluate(
      @RequestParam Long questionId,
      @RequestParam(name = "fileName", required = false, defaultValue = DEFAULT_FILE_NAME)
      String fileName
  ) {
    try {
      // 1) S3에서 STT 텍스트 추출
      String sttText = transcriptionService.transcribeFromS3(fileName);

      // 2) STT 텍스트를 3~5문장으로 요약
      String summary = summarizationService.summarize(sttText);

      // 3) DB에서 질문 텍스트 조회
      String questionText = questionRepository.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException("Invalid questionId: " + questionId))
          .getContent();

      // 4) 질문과 요약 텍스트 간 유사도 계산
      double score = similarityService.compare(questionText, summary);
      boolean match = score >= 0.7;

      // 5) 결과 맵 구성 및 반환
      Map<String, Object> result = new HashMap<>();
      result.put("text", sttText);
      result.put("summary", summary);
      result.put("score", score);
      result.put("match", match);

      return ResponseEntity.ok(result);
    } catch (Exception e) {
      // 예외 발생 시 에러 정보 반환
      return ResponseEntity.status(500)
          .body(Map.of("error", e.getMessage()));
    }
  }
}
