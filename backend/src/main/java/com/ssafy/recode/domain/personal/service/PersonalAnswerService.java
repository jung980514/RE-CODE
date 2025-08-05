// src/main/java/com/ssafy/recode/domain/personal/service/PersonalAnswerService.java
package com.ssafy.recode.domain.personal.service;

import com.ssafy.recode.domain.personal.entity.PersonalAnswer;
import com.ssafy.recode.domain.personal.entity.PersonalQuestion;
import com.ssafy.recode.domain.personal.repository.PersonalQuestionRepository;
import com.ssafy.recode.domain.common.service.PromptEvaluationService;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * “personal” 질문에 대한 답변 파이프라인
 * 1) MP4→WAV 변환·업로드
 * 2) WAV→STT 전사
 * 3) 전사 텍스트→LLM 평가
 * 4) 결과 엔티티 저장
 */
@Service
@RequiredArgsConstructor
public class PersonalAnswerService {

  private static final String FOLDER = "personal";
  private static final double MATCH_THRESHOLD = 70.0;

  private final VideoTranscriptionService transcriptionService;
  private final S3UploaderService           s3UploaderService;
  private final PromptEvaluationService     promptEvaluationService;
  private final PersonalQuestionRepository  questionRepository;

  @PersistenceContext
  private final EntityManager               entityManager;

  /**
   * MP4 → WAV 변환 후 S3에 업로드
   *
   * @param file 클라이언트가 전송한 MP4 파일
   * @return 업로드된 WAV 파일의 S3 키
   */
  public String uploadMedia(MultipartFile file) {
    return s3UploaderService.uploadAsWav(file, FOLDER);
  }

  /**
   * 답변 처리 전체 흐름을 비동기로 실행합니다.
   * 1) STT 전사
   * 2) 질문 조회
   * 3) LLM 평가→score
   * 4) match 여부 판단
   * 5) mediaKey→videoPath 변환
   * 6) PersonalAnswer 엔티티 생성·저장
   *
   * @param questionId 질문 ID
   * @param userId     사용자 ID
   * @param mediaKey   업로드된 WAV 파일의 S3 키
   */
  @Async
  @Transactional
  public void processAnswerAsync(Long questionId, Long userId, String mediaKey) {
    try {
      // 1) STT 전사
      String answerText = transcriptionService.transcribeFromS3(mediaKey);

      // 2) 질문 조회
      PersonalQuestion question = questionRepository.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException(
              "유효하지 않은 questionId=" + questionId));

      // 3) LLM 평가
      double score = promptEvaluationService
          .evaluateAnswer(question.getContent(), answerText);

      // 4) match 여부
      boolean isMatch = score >= MATCH_THRESHOLD;

      // 5) mediaKey → videoPath 변환
      String mediaPath = mediaKey.replaceFirst("\\.wav$", ".mp4");

      // 6) 엔티티 생성·저장
      PersonalAnswer answer = PersonalAnswer.builder()
          .questionId(questionId)
          .userId(userId)
          .answer(answerText)
          .score(score)
          .isMatch(isMatch)
          .videoPath(mediaPath)
          .build();
      entityManager.persist(answer);

    } catch (Exception e) {
      throw new RuntimeException(
          "PersonalAnswer 처리 중 오류 발생 (questionId=" + questionId + ")", e);
    }
  }
}
