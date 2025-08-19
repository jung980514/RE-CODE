package com.ssafy.recode.global.dto.response.calendar;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyCalendarResponse {

  private LocalDate date;   // 날짜
  private boolean hasData;  // 데이터 존재 여부
}