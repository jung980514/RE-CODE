package com.ssafy.recode.domain.basic.service;

import com.ssafy.recode.domain.basic.entity.BasicAnswer;
import com.ssafy.recode.domain.basic.entity.BasicQuestion;
import com.ssafy.recode.domain.basic.repository.BasicQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@RequiredArgsConstructor
public class BasicAnswerService {

  private final VideoTranscriptionService transcriptionService;
  private final SummarizationService summarizationService;
  private final SimilarityService similarityService;
  private final BasicQuestionRepository basicQuestionRepository;
  private final S3UploaderService s3UploaderService;

  /** JPA EntityManager (jakarta.persistence) */
  @PersistenceContext
  private EntityManager entityManager;

  public String uploadVideoAsWav(MultipartFile file) {
    return s3UploaderService.uploadAsWav(file);
  }

  @Async
  @Transactional
  public void processAnswerAsync(Long questionId, Long userId, String wavKey) {
    try {
      // 1) STT
      String sttText = transcriptionService.transcribeFromS3(wavKey);

      // 2) 요약
      String summary = summarizationService.summarize(sttText);

      // 3) 질문 조회
      BasicQuestion question = basicQuestionRepository.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException("Invalid questionId: " + questionId));

      // 4) 유사도 계산
      double score = similarityService.compare(question.getContent(), summary);
      boolean match = score >= 0.7;

      // 5) 새 BasicAnswer 엔티티 생성
      BasicAnswer answer = BasicAnswer.builder()
          .questionId(questionId)
          .userId(userId)
          .sttText(sttText)
          .keywords(summary)
          .score(score)
          .isMatch(match)
          .videoPath(wavKey)
          .build();

      // ▶ 항상 INSERT: save() 대신 persist()
      entityManager.persist(answer);

      // 저장 완료 로그 출력
      System.out.println("✅ BasicAnswer 저장 완료: answerId=" + answer.getAnswerId()
          + ", questionId=" + questionId
          + ", userId=" + userId);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}
