package com.ssafy.recode.domain.cognitive.service;

import com.ssafy.recode.domain.cognitive.entity.CognitiveAnswer;
import com.ssafy.recode.domain.cognitive.entity.CognitiveQuestion;
import com.ssafy.recode.domain.cognitive.repository.CognitiveAnswerRepository;
import com.ssafy.recode.domain.cognitive.repository.CognitiveQuestionRepository;
import com.ssafy.recode.domain.common.service.AiPromptService;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CognitiveAnswerService {

  private static final String AUDIO_FOLDER    = "cognitive-sound";
  private static final String IMAGE_FOLDER    = "cognitive-image";
  private static final double MATCH_THRESHOLD = 70.0;

  private final VideoTranscriptionService   transcriptionService;
  private final S3UploaderService           uploader;
  private final AiPromptService             evaluator;
  private final CognitiveQuestionRepository questionRepo;
  private final CognitiveAnswerRepository   answerRepo;

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
  @Transactional
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
      double score = evaluator.evaluateAnswer(question.getContent(), answerText);
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
      answerRepo.save(answer);

    } catch (Exception e) {
      throw new RuntimeException(
          "CognitiveAnswer 처리 중 오류 (questionId=" + questionId + ")", e);
    }
  }
}