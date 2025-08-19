package com.ssafy.recode.domain.personal.service;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.calender.entity.DailyEmotionSummary;
import com.ssafy.recode.domain.calender.repository.DailyEmotionSummaryRepository;
import com.ssafy.recode.domain.common.service.AiPromptService;
import com.ssafy.recode.domain.common.service.GenericPersistenceService;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import com.ssafy.recode.domain.link.repository.GuardianElderRepository;
import com.ssafy.recode.domain.personal.entity.PersonalAnswer;
import com.ssafy.recode.domain.personal.entity.PersonalQuestion;
import com.ssafy.recode.domain.personal.repository.PersonalAnswerRepository;
import com.ssafy.recode.domain.personal.repository.PersonalAnswerRepository.PersonalVideoRow;
import com.ssafy.recode.domain.personal.repository.PersonalQuestionRepository;
import com.ssafy.recode.global.dto.request.EmotionRequset;
import com.ssafy.recode.global.dto.response.calendar.VideoListResponse;
import com.ssafy.recode.global.dto.response.calendar.VideoUrlItem;
import com.ssafy.recode.global.dto.response.link.ElderSummaryResponse;
import com.ssafy.recode.global.enums.AnswerType;
import com.ssafy.recode.global.enums.Role;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PersonalService {

  private static final String FOLDER = "personal";
  private static final double MATCH_THRESHOLD = 70.0;

  private final VideoTranscriptionService    transcriptionService;
  private final S3UploaderService            uploader;
  private final AiPromptService              aiPromptService;
  private final PersonalQuestionRepository   questionRepo;
  private final PersonalAnswerRepository     answerRepo;
  private final GenericPersistenceService    genericPersistenceService;
  private final PersonalAnswerRepository personalAnswerRepository;
  private final DailyEmotionSummaryRepository dailyEmotionSummaryRepository;
  private final GuardianElderRepository guardianElderRepository;

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
  public void processAnswerAsync(Long questionId, Long userId, String mediaKey) {
    try {
      // 1) 영상 → 텍스트 변환
      String answerText = transcriptionService.transcribeVideo(mediaKey);

      // 2) 질문 조회
      PersonalQuestion question = questionRepo.findById(questionId)
          .orElseThrow(() -> new IllegalArgumentException("Invalid questionId=" + questionId));

      // 3) LLM 평가 → 점수, 매칭 여부
      double score = aiPromptService.evaluateAnswer(question.getContent(), answerText);
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

      genericPersistenceService.save(answer);

    } catch (Exception e) {
      throw new RuntimeException(
          "PersonalAnswer 처리 중 오류 (questionId=" + questionId + ")", e);
    }
  }
  /**
   * 유저가 마지막으로 답변한 questionId 이후의 질문 3개를 반환.
   * (답변이 없으면 처음 3개, 모자랄 경우 앞에서 채움)
   */
  public List<PersonalQuestion> getNextQuestions(Long userId) {
    // 가장 최근에 답변한 questionId (아직 없으면 0)
    Long lastQuestionid = answerRepo.findMaxQuestionIdByUserId(userId);

    // 이후 3개
    List<PersonalQuestion> next = questionRepo
        .findTop3ByUserIdAndQuestionIdGreaterThanOrderByQuestionIdAsc(userId, lastQuestionid);

    // 모자르면 처음 3개
    if (next.size() < 3) {
      int need = 3 - next.size();
      List<PersonalQuestion> head = questionRepo
          .findTop3ByUserIdOrderByQuestionIdAsc(userId);
      next.addAll(head.subList(0, Math.min(need, head.size())));
    }
    return next;
  }

  public boolean isPersonalCompleted(Long userId) {
    LocalDate today = LocalDate.now();  // 시스템 로컬타임(Asia/Seoul)
    LocalDateTime startOfDay = today.atStartOfDay();
    LocalDateTime endOfDay = today.plusDays(1).atStartOfDay().minusNanos(1);

    return personalAnswerRepository.existsByUserIdAndCreatedAtBetween(
            userId, startOfDay, endOfDay
    );
  }

  @Transactional
  public void addEmotions(User user, EmotionRequset requset){
    DailyEmotionSummary dailyEmotionSummary = DailyEmotionSummary
        .builder()
        .userId(user.getId())
        .summaryDate(LocalDate.now())
        .answerType(AnswerType.PERSONAL)
        .dominantEmotion(requset.emotion())
        .createdAt(LocalDateTime.now())
        .build();

    dailyEmotionSummaryRepository.save(dailyEmotionSummary);
  }

  public VideoListResponse getPersonalVideosByDate(User user, LocalDate date) {
    Long elderId = user.getId();
    if(user.getRole() != Role.ELDER){
      List<ElderSummaryResponse> list = guardianElderRepository.findLinkedEldersByGuardianId(user.getId());
      elderId = list.get(0).id();
    }

    // 1) DB에서 저장된 video_path(키 또는 URL) 조회
    List<PersonalVideoRow> rows = personalAnswerRepository.findVideoPathsByDate(elderId, date);

    // 2) videoPath → S3 key 정규화 후 presign, answerId와 함께 DTO로
    List<VideoUrlItem> items = rows.stream()
        .filter(r -> r.getVideoPath() != null)
        .map(r -> new VideoUrlItem(
            r.getAnswerId(),
            r.getQuestionId(),
            r.getContent(),
            transcriptionService.presign(transcriptionService.toS3Key(r.getVideoPath()),"video/mp4", 60),
            r.getScore(),
            r.getIsMatch(),
            r.getCreatedAt()
        ))
        .toList();

    return new VideoListResponse(date, !items.isEmpty(), items);
  }
}
