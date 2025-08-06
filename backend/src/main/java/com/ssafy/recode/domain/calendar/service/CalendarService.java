package com.ssafy.recode.domain.calendar.service;

import com.ssafy.recode.domain.calendar.dto.CalendarEmotionDTO;
import com.ssafy.recode.domain.calendar.dto.DailyDetailDTO;
import com.ssafy.recode.domain.calendar.repository.CalendarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarRepository calendarRepository;

    public List<CalendarEmotionDTO> getMonthlyEmotions(Long userId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return calendarRepository.findMonthlyEmotions(userId, start, end);
    }

    public DailyDetailDTO getDailyDetail(Long userId, LocalDate date) {
        return calendarRepository.findDailyDetail(userId, date);
    }

}
