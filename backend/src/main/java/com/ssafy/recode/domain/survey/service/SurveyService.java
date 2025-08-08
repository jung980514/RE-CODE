// src/main/java/com/ssafy/recode/domain/personal/service/PersonalAnswerService.java
package com.ssafy.recode.domain.survey.service;

import com.ssafy.recode.domain.common.service.GenericPersistenceService;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import com.ssafy.recode.domain.survey.entity.SurveyAnswer;
import com.ssafy.recode.domain.survey.repository.SurveyRepository;
import com.ssafy.recode.domain.survey.repository.DailyServeyCheckRepository;
import com.ssafy.recode.global.dto.response.survey.SurveyQAResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyService {

  private static final String FOLDER = "servey";

  private final SurveyRepository surveyRepository;
  private final DailyServeyCheckRepository dailyServeyCheckRepository;
  private final VideoTranscriptionService transcriptionService;
  private final S3UploaderService uploader;
  private final GenericPersistenceService genericPersistenceService;

  /**
   * 일일 설문 질문 조회
   *
   * @return
   */
  public List<String> getTodaySurveyQuestions() {
    return surveyRepository.findTodayQuestions();
  }

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

      // 2) 결과 엔티티 생성 및 저장
      SurveyAnswer answer = SurveyAnswer.builder()
              .questionId(questionId)
              .userId(userId)
              .answer(answerText) // 실제 유저의 답변 텍스트
              .build();

      genericPersistenceService.save(answer);

      // 개인화 질문 생성

    } catch (Exception e) {
      throw new RuntimeException(
              "SurveyAnswer 처리 중 오류 (questionId=" + questionId + ")", e);
    }
  }

  /**
   * 당일 기초 설문 달성 여부
   */
  public boolean hasCompletedDailySurvey(Long userId) {
    LocalDate today = LocalDate.now();  // 시스템 로컬타임(Asia/Seoul)
    LocalDateTime startOfDay = today.atStartOfDay();
    LocalDateTime endOfDay = today.plusDays(1).atStartOfDay().minusNanos(1);

    // 단순 응답 존재 여부
    return dailyServeyCheckRepository.existsByUserIdAndCreatedAtBetween(
            userId, startOfDay, endOfDay
    );
  }
    /**
     * 일일 설문 답변 조회(당일)
     * @param userId
     * @return
     */
  public List<SurveyQAResponse> getTodayPersonalQA (Long userId){
    LocalDateTime start = LocalDate.now().atStartOfDay();         // 오늘 00:00
    LocalDateTime end = start.plusDays(1);                        // 내일 00:00

    return surveyRepository.findTodayQAByUserId(userId, start, end);
  }

}
