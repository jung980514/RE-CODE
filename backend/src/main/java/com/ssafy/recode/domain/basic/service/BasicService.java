package com.ssafy.recode.domain.basic.service;

import com.ssafy.recode.domain.basic.entity.BasicAnswer;
import com.ssafy.recode.domain.basic.entity.BasicQuestion;
import com.ssafy.recode.domain.basic.repository.BasicAnswerRepository;
import com.ssafy.recode.domain.basic.repository.BasicQuestionRepository;
import com.ssafy.recode.domain.common.service.AiPromptService;
import com.ssafy.recode.domain.common.service.GenericPersistenceService;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BasicService {

  private static final String FOLDER = "basic";
  private static final double MATCH_THRESHOLD = 70.0;

  private final S3UploaderService            uploader;
  private final VideoTranscriptionService    transcriptionService;
  private final AiPromptService              aiPromptService;
  private final BasicQuestionRepository      questionRepo;
  private final BasicAnswerRepository        answerRepo;
  private final GenericPersistenceService    genericPersistenceService;

  /** MP4 파일을 S3에 업로드하고 key 반환 */
  public String uploadMedia(MultipartFile file) {
    return uploader.uploadRawMedia(file, FOLDER);
  }

  /** 비동기로 STT 처리 및 평가, 결과 저장 */
  @Async
  public void processAnswerAsync(Long questionId, Long userId, String mediaKey) {
    try {
      // 1) S3 업로드된 영상 → 텍스트 변환
      String answerText = transcriptionService.transcribeVideo(mediaKey);

      // 2) 질문 내용 조회
      BasicQuestion question = questionRepo.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException("Invalid questionId=" + questionId));

      // 3) LLM 평가 → 점수 산출 및 매칭 여부 판단
      double score   = aiPromptService.evaluateAnswer(question.getContent(), answerText);
      boolean isMatch = score >= MATCH_THRESHOLD;

      // 4) BasicAnswer 엔티티 생성 및 저장
      BasicAnswer answer = BasicAnswer.builder()
          .questionId(questionId)
          .userId(userId)
          .answer(answerText)
          .score(score)
          .isMatch(isMatch)
          .videoPath(mediaKey)
          .build();

      genericPersistenceService.save(answer);

    } catch (Exception e) {
      throw new RuntimeException("BasicAnswer 처리 중 오류 (questionId=" + questionId + ")", e);
    }
  }

  /**
   * 유저가 마지막으로 답변한 questionId 이후의 질문 3개를 반환.
   * (답변이 없으면 처음 3개, 모자랄 경우 앞에서 채움)
   */
  public List<BasicQuestion> getNextQuestions(Long userId) {
    // 유저가 마지막으로 답변한 questionId (답변 없으면 0)
    Long lastQuestionId = answerRepo.findMaxQuestionIdByUserId(userId);

    // 마지막 이후의 3개 질문 조회
    List<BasicQuestion> next = questionRepo.findTop3ByIdGreaterThanOrderByIdAsc(lastQuestionId);

    // 3개 미만이라면 처음부터 이어 붙이기
    if (next.size() < 3) {
      int needed = 3 - next.size();
      List<BasicQuestion> head = questionRepo.findTop3ByOrderByIdAsc();
      next.addAll(head.subList(0, Math.min(needed, head.size())));
    }

    return next;
  }
}
