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
  private final PromptEvaluationService evaluationService;
  private final BasicQuestionRepository basicQuestionRepository;
  private final S3UploaderService s3UploaderService;

  @PersistenceContext
  private EntityManager entityManager;

  /**
   * 클라이언트로부터 받은 MP4 파일을 S3에 올리고,
   * WAV로 변환한 뒤에도 S3에 올립니다.
   * @return 업로드된 WAV 파일의 S3 key
   */
  public String uploadVideoAsWav(MultipartFile file) {
    return s3UploaderService.uploadAsWav(file);
  }

  /**
   * 녹음 파일(wavKey)을 처리하는 비동기 메서드:
   *  1) STT로 텍스트 추출
   *  2) 질문 조회
   *  3) LLM 평가로 0~100 점수 획득
   *  4) match 여부(score >= 70)
   *  5) WAV key → MP4 key 유추
   *  6) BasicAnswer 엔티티에 score, isMatch, videoPath 저장
   */
  @Async
  @Transactional
  public void processAnswerAsync(Long questionId, Long userId, String wavKey) {
    try {
      // 1) STT
      String sttText = transcriptionService.transcribeFromS3(wavKey);

      // 2) 질문 조회
      BasicQuestion question = basicQuestionRepository.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException("Invalid questionId: " + questionId));

      // 3) LLM 평가 → 0~100 점수
      double score = evaluationService.evaluateAnswer(question.getContent(), sttText);

      // 4) match 여부 (예: 70점 이상이면 true)
      boolean match = score >= 70.0;

      // 5) WAV key 에서 MP4 key 유추
      String mp4Key = wavKey.replaceFirst("\\.wav$", ".mp4");

      // 6) 엔티티 생성 및 저장
      BasicAnswer answer = BasicAnswer.builder()
          .questionId(questionId)
          .userId(userId)
          .sttText(sttText)
          .keywords(sttText)
          .score(score)
          .isMatch(match)
          .videoPath(mp4Key)
          .build();

      entityManager.persist(answer);

      System.out.println("✅ BasicAnswer 저장: id=" + answer.getAnswerId()
          + ", score=" + score
          + ", match=" + match
          + ", videoPath=" + mp4Key);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}
