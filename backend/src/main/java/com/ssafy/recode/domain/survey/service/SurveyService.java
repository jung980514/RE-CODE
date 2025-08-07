// src/main/java/com/ssafy/recode/domain/personal/service/PersonalAnswerService.java
package com.ssafy.recode.domain.survey.service;

import com.ssafy.recode.domain.common.service.GenericPersistenceService;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import com.ssafy.recode.domain.survey.entity.SurveyAnswer;
import com.ssafy.recode.domain.survey.repository.SurveyRepository;
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
  private final VideoTranscriptionService transcriptionService;
  private final S3UploaderService uploader;
  private final GenericPersistenceService genericPersistenceService;

  /**
   * 일일 설문 질문 조회
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

}
