// src/main/java/com/ssafy/recode/domain/personal/service/PersonalAnswerService.java
package com.ssafy.recode.domain.survey.service;

import com.ssafy.recode.domain.survey.repository.SurveyRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyService {

  private static final String FOLDER = "servey";
  private final SurveyRepository surveyRepository;

  public List<String> getTodaySurveyQuestions() {
    List<String> questions = surveyRepository.findTodayQuestions();
    return questions;
  }

}
