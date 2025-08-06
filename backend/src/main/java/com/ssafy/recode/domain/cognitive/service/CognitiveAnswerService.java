// src/main/java/com/ssafy/recode/domain/cognitive/service/CognitiveAnswerService.java
package com.ssafy.recode.domain.cognitive.service;

import com.ssafy.recode.domain.cognitive.entity.CognitiveAnswer;
import com.ssafy.recode.domain.cognitive.entity.CognitiveQuestion;
import com.ssafy.recode.domain.cognitive.repository.CognitiveQuestionRepository;
import com.ssafy.recode.domain.common.service.AiPromptService;
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
 * “cognitive” 도메인 답변 파이프라인
 *  - audio/image mediaType별 통합 처리
 */
@Service
@RequiredArgsConstructor
public class CognitiveAnswerService {

  private static final String AUDIO_FOLDER    = "cognitive-sound";
  private static final String IMAGE_FOLDER    = "cognitive-image";
  private static final double MATCH_THRESHOLD = 70.0;

  private final VideoTranscriptionService    transcriptionService;
  private final S3UploaderService            s3UploaderService;
  private final AiPromptService              aiPromptService;
  private final CognitiveQuestionRepository  questionRepository;

  @PersistenceContext
  private final EntityManager                entityManager;

  /**
   * mediaType에 따라
   *  - "audio": MP4→WAV 변환 후 업로드
   *  - "image": 파일 그대로 업로드
   *
   * @param file      업로드할 파일
   * @param mediaType "audio" 또는 "image"
   * @return S3에 저장된 미디어 키
   */
  public String uploadMedia(MultipartFile file, String mediaType) {
    String folder = "audio".equals(mediaType) ? AUDIO_FOLDER : IMAGE_FOLDER;
    return s3UploaderService.uploadAsWav(file, folder);
  }

  /**
   * 답변 처리 파이프라인을 비동기로 실행합니다.
   * 1) audio→STT, image→mediaKey
   * 2) 질문 조회
   * 3) LLM 평가→score
   * 4) match 여부 판단
   * 5) mediaKey→mediaPath(mp4 or URL)
   * 6) CognitiveAnswer 엔티티 저장
   *
   * @param questionId 질문 ID
   * @param userId     사용자 ID
   * @param mediaKey   S3에 저장된 미디어 키
   * @param mediaType  "audio" 또는 "image"
   */
  @Async
  @Transactional
  public void processAnswerAsync(
      Long questionId,
      Long userId,
      String mediaKey,
      String mediaType
  ) {
    try {
      // 1) answerText 결정
      String answerText = "audio".equals(mediaType)
          ? transcriptionService.transcribeFromS3(mediaKey)
          : mediaKey;

      // 2) 질문 조회
      CognitiveQuestion question = questionRepository.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException(
              "유효하지 않은 questionId=" + questionId));

      // 3) LLM 평가
      double score = aiPromptService
          .evaluateAnswer(question.getContent(), answerText);

      // 4) match 여부
      boolean isMatch = score >= MATCH_THRESHOLD;

      // 5) mediaPath 결정
      String mediaPath = "audio".equals(mediaType)
          ? mediaKey.replaceFirst("\\.wav$", ".mp4")
          : mediaKey;

      // 6) 엔티티 생성·저장
      CognitiveAnswer answer = CognitiveAnswer.builder()
          .question(question)
          .userId(userId)
          .answer(answerText)
          .score(score)
          .isMatch(isMatch)
          .videoPath(mediaPath)
          .mediaType(mediaType)
          .build();
      entityManager.persist(answer);

    } catch (Exception e) {
      throw new RuntimeException(
          "CognitiveAnswer 처리 중 오류 발생 (questionId=" + questionId + ")", e);
    }
  }
}
