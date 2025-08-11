package com.ssafy.recode.domain.calender.controller;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.calender.service.CalenderService;
import com.ssafy.recode.domain.survey.service.SurveyService;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.security.annotation.LoginUser;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calender")
@RequiredArgsConstructor
public class CalenderController {

  private final SurveyService surveyService;
  private final CalenderService calenderService;

  /**
   *
   * @param user
   * @param year
   * @param month
   * @return
   */
  @GetMapping
  public ResponseEntity<?> getMonthlyCalendar(
      @LoginUser User user,
      @RequestParam int year,
      @RequestParam int month
  ){
    return ResponseEntity.ok(ApiResponse.successResponse(surveyService.getMonthlyCalendar(user, year, month)));
  }

  @GetMapping("/{date}/emotions")
  public ResponseEntity<?> getEmotions(
      @LoginUser User user,
      @PathVariable
      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
  ) {
    return ResponseEntity.ok(ApiResponse.successResponse(calenderService.getEmotionsByDatePerType(user, date)));
  }
}
