package com.ssafy.recode.domain.cognitive.service;

import com.ssafy.recode.domain.cognitive.entity.CognitiveAnswer;
import com.ssafy.recode.domain.cognitive.entity.CognitiveQuestion;
import com.ssafy.recode.domain.cognitive.repository.CognitiveAnswerRepository;
import com.ssafy.recode.domain.cognitive.repository.CognitiveQuestionRepository;
import com.ssafy.recode.domain.common.service.AiPromptService;
import com.ssafy.recode.domain.common.service.GenericPersistenceService;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CognitiveService {

  private static final String AUDIO_FOLDER    = "cognitive-sound";
  private static final String IMAGE_FOLDER    = "cognitive-image";
  private static final double MATCH_THRESHOLD = 70.0;

  private final VideoTranscriptionService   transcriptionService;
  private final S3UploaderService           uploader;
  private final AiPromptService             aiPromptService;
  private final CognitiveQuestionRepository questionRepo;
  private final CognitiveAnswerRepository   answerRepo;
  private final GenericPersistenceService   genericPersistenceService;
  private final CognitiveAnswerRepository cognitiveAnswerRepository;

  /**
   * mediaType에 따라 audio/mp4 또는 이미지 파일을 S3에 업로드
   */
  public String uploadMedia(MultipartFile file, String mediaType) {
    String folder = "audio".equals(mediaType) ? AUDIO_FOLDER : IMAGE_FOLDER;
    return uploader.uploadRawMedia(file, folder);
  }

  /**
   * 비동기로 응답 처리: audio이면 STT, image면 URL 그대로 → 평가 → 저장
   */
  @Async
  public void processAnswerAsync(
      Long questionId,
      Long userId,
      String mediaKey,
      String mediaType
  ) {
    try {
      // 1) 답변 텍스트 결정
      String answerText;
      if ("audio".equals(mediaType)) {
        // 동영상/mp4 → 텍스트 변환
        answerText = transcriptionService.transcribeVideo(mediaKey);
      } else {
        // 이미지인 경우 URL 또는 key 그대로 사용
        answerText = mediaKey;
      }

      // 2) 질문 조회
      CognitiveQuestion question = questionRepo.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException("Invalid questionId=" + questionId));

      // 3) LLM 평가 → 점수, 매칭 여부
      double score = aiPromptService.evaluateAnswer(question.getContent(), answerText);
      boolean isMatch = score >= MATCH_THRESHOLD;

      // 4) 결과 엔티티 생성 및 저장
      CognitiveAnswer answer = CognitiveAnswer.builder()
          .question(question)
          .userId(userId)
          .answer(answerText)
          .score(score)
          .isMatch(isMatch)
          .videoPath(mediaKey)
          .mediaType(mediaType)
          .build();
      genericPersistenceService.save(answer);

    } catch (Exception e) {
      throw new RuntimeException(
          "CognitiveAnswer 처리 중 오류 (questionId=" + questionId + ")", e);
    }
  }
  /**
   * 유저가 마지막으로 답변한 questionId(해당 mediaType 기준) 이후의 질문 3개 반환.
   * 부족하면 같은 mediaType의 앞부분에서 채움.
   */
  public List<CognitiveQuestion> getNextQuestionsByType(Long userId, String mediaType) {
    Long lastQuestionId = answerRepo.findMaxQuestionIdByUserIdAndMediaType(userId, mediaType);

    List<CognitiveQuestion> next =
        questionRepo.findTop3ByQuestionIdGreaterThanAndMediaTypeOrderByQuestionIdAsc(
            lastQuestionId, mediaType
        );

    if (next.size() < 3) {
      int needed = 3 - next.size();
      List<CognitiveQuestion> head =
          questionRepo.findTop3ByMediaTypeOrderByQuestionIdAsc(mediaType);
      next.addAll(head.subList(0, Math.min(needed, head.size())));
    }
    return next;
  }
  public boolean isCognitiveCompleted(Long userId, String mediaType) {
    LocalDate today = LocalDate.now();  // 시스템 로컬타임(Asia/Seoul)
    LocalDateTime startOfDay = today.atStartOfDay();
    LocalDateTime endOfDay = today.plusDays(1).atStartOfDay().minusNanos(1);

    return cognitiveAnswerRepository.existsByUserIdAndCreatedAtBetweenAndMediaType(
            userId, startOfDay, endOfDay, mediaType
    );
  }
}