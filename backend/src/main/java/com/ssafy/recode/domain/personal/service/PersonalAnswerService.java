package com.ssafy.recode.domain.personal.service;

import com.ssafy.recode.domain.personal.entity.PersonalAnswer;
import com.ssafy.recode.domain.personal.entity.PersonalQuestion;
import com.ssafy.recode.domain.personal.repository.PersonalAnswerRepository;
import com.ssafy.recode.domain.personal.repository.PersonalQuestionRepository;
import com.ssafy.recode.domain.common.service.PromptEvaluationService;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PersonalAnswerService {

  private static final String FOLDER = "personal";
  private static final double MATCH_THRESHOLD = 70.0;

  private final VideoTranscriptionService    transcriptionService;
  private final S3UploaderService            uploader;
  private final PromptEvaluationService      evaluator;
  private final PersonalQuestionRepository   questionRepo;
  private final PersonalAnswerRepository     answerRepo;

  /**
   * MP4 파일을 S3에 올리고 key 반환
   */
  public String uploadMedia(MultipartFile file) {
    return uploader.uploadRawMedia(file, FOLDER);
  }

  /**
   * 비동기로 영상 STT 처리 → 평가 → 저장
   */
  @Async
  @Transactional
  public void processAnswerAsync(Long questionId, Long userId, String mediaKey) {
    try {
      // 1) 영상 → 텍스트 변환
      String answerText = transcriptionService.transcribeVideo(mediaKey);

      // 2) 질문 조회
      PersonalQuestion question = questionRepo.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException("Invalid questionId=" + questionId));

      // 3) LLM 평가 → 점수, 매칭 여부
      double score = evaluator.evaluateAnswer(question.getContent(), answerText);
      boolean isMatch = score >= MATCH_THRESHOLD;

      // 4) 결과 엔티티 생성 및 저장
      PersonalAnswer answer = PersonalAnswer.builder()
          .questionId(questionId)
          .userId(userId)
          .answer(answerText)
          .score(score)
          .isMatch(isMatch)
          .videoPath(mediaKey)
          .build();
      answerRepo.save(answer);

    } catch (Exception e) {
      throw new RuntimeException(
          "PersonalAnswer 처리 중 오류 (questionId=" + questionId + ")", e);
    }
  }
}
