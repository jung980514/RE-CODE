package com.ssafy.recode.domain.calendar.repository;

import com.ssafy.recode.domain.calendar.dto.CalendarEmotionDTO;
import com.ssafy.recode.domain.calendar.dto.DailyDetailDTO;

import java.time.LocalDate;
import java.util.List;

public interface CalendarRepository {
    List<CalendarEmotionDTO> findMonthlyEmotions(Long userId, LocalDate startDate, LocalDate endDate);
    DailyDetailDTO findDailyDetail(Long userId, LocalDate date);

}
