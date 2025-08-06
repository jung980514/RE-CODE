package com.ssafy.recode.domain.basic.service;

import com.ssafy.recode.domain.basic.entity.BasicAnswer;
import com.ssafy.recode.domain.basic.entity.BasicQuestion;
import com.ssafy.recode.domain.basic.repository.BasicAnswerRepository;
import com.ssafy.recode.domain.basic.repository.BasicQuestionRepository;
<<<<<<< backend/src/main/java/com/ssafy/recode/domain/basic/service/BasicAnswerService.java
import com.ssafy.recode.domain.common.service.AiPromptService;
=======
>>>>>>> backend/src/main/java/com/ssafy/recode/domain/basic/service/BasicAnswerService.java
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import com.ssafy.recode.domain.common.service.PromptEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class BasicAnswerService {

  private static final String FOLDER = "basic";
  private static final double MATCH_THRESHOLD = 70.0;

  private final S3UploaderService         uploader;
  private final VideoTranscriptionService transcriptionService;

  private final AiPromptService   evaluator;
  private final BasicQuestionRepository   questionRepo;
  private final BasicAnswerRepository     answerRepo;


  /**
   * MP4 파일을 S3에 올리고 key 반환
   */
  public String uploadMedia(MultipartFile file) {
    return uploader.uploadRawMedia(file, FOLDER);
  }

  /**
   * 비동기로 영상 STT 처리 후 결과 저장
   */
  @Async
  @Transactional
  public void processAnswerAsync(Long questionId, Long userId, String mediaKey) {
    try {
      // 1) S3에 올라간 영상 → 텍스트 반환
      String answerText = transcriptionService.transcribeVideo(mediaKey);

      // 2) 질문 조회
      BasicQuestion question = questionRepo.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException("Invalid questionId=" + questionId));

      // 3) LLM 평가 → 점수 계산 및 매칭 여부 판단
      double score = evaluator.evaluateAnswer(question.getContent(), answerText);
      boolean isMatch = score >= MATCH_THRESHOLD;

      // 4) 결과 엔티티 생성 및 저장
      BasicAnswer answer = BasicAnswer.builder()
          .questionId(questionId)
          .userId(userId)
          .answer(answerText)
          .score(score)
          .isMatch(isMatch)
          .videoPath(mediaKey)
          .build();

      answerRepo.save(answer);
    } catch (Exception e) {
      throw new RuntimeException("BasicAnswer 처리 중 오류 (questionId=" + questionId + ")", e);
    }
  }
}
