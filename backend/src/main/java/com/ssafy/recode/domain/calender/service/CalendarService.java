package com.ssafy.recode.domain.calender.service;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.calender.repository.DailyEmotionSummaryRepository;
import com.ssafy.recode.domain.link.repository.GuardianElderRepository;
import com.ssafy.recode.global.dto.response.calendar.EmotionByTypeResponse;
import com.ssafy.recode.global.dto.response.link.ElderSummaryResponse;
import com.ssafy.recode.global.enums.Role;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CalendarService {

  private final DailyEmotionSummaryRepository dailyEmotionSummaryRepository;
  private final GuardianElderRepository guardianElderRepository;

  public List<EmotionByTypeResponse> getEmotionsByDatePerType(User user, LocalDate date) {
    Long elderId = user.getId();
    if(user.getRole() != Role.ELDER){
      List<ElderSummaryResponse> list = guardianElderRepository.findLinkedEldersByGuardianId(user.getId());
      elderId = list.get(0).id();
    }
    return dailyEmotionSummaryRepository.findEmotionByDatePerTypeRaw(elderId, date).stream()
        .map(row -> {
          Long _userId = ((Number) row[0]).longValue();
          LocalDate _date = ((Date) row[1]).toLocalDate();
          String answerType = (String) row[2];
          String dominantEmotion = (String) row[3]; // NULL 가능
          LocalDateTime createdAt = row[4] == null ? null : ((Timestamp) row[4]).toLocalDateTime();
          return new EmotionByTypeResponse(_userId, _date, answerType, dominantEmotion, createdAt);
        })
        .toList();
  }

}
