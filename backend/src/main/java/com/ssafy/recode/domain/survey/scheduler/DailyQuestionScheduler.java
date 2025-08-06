package com.ssafy.recode.domain.survey.scheduler;

import com.ssafy.recode.domain.common.service.AiPromptService;
import com.ssafy.recode.domain.survey.entity.SurveyQuestion;
import com.ssafy.recode.domain.survey.repository.SurveyRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyQuestionScheduler {

  private final SurveyRepository surveyRepository;
  private final AiPromptService aiPromptService;

  @Scheduled(cron = "0 0 0 1 * *", zone = "Asia/Seoul") // 매월 1일 자정
  @Transactional
  public void generateDailySurveyQuestions() throws Exception {
    log.info("⏰ 일일 설문 생성 시작");

    List<String> questions = aiPromptService.generateDailyQuestions();

    int successCount = 0;
    for (String q : questions) {
      try {
        surveyRepository.save(new SurveyQuestion(q));
        successCount++;
        log.info("✅ 저장된 질문: {}", q);
      } catch (DataIntegrityViolationException e) {
        log.warn("⚠️ 중복 질문 무시: {}", q);
      }
    }

    log.info("✅ 총 {}개의 질문 저장 완료", successCount);
  }

}
