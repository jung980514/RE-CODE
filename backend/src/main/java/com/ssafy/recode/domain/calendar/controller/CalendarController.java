package com.ssafy.recode.domain.calendar.controller;

import com.ssafy.recode.domain.calendar.dto.CalendarEmotionDTO;
import com.ssafy.recode.domain.calendar.dto.DailyDetailDTO;
import com.ssafy.recode.domain.calendar.service.CalendarService;
import com.ssafy.recode.global.dto.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/calendar")
@Tag(name = "Calendar", description = "캘린더 감정 조회 API")
public class CalendarController {

    private final CalendarService calendarService;

    @Operation(summary = "월간 감정 조회", description = "로그인된 사용자의 한 달 감정 데이터를 날짜별로 조회합니다.")
    @GetMapping("/monthly/emotion")
    public ResponseEntity<List<CalendarEmotionDTO>> getMonthlyEmotions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "연도", example = "2025")
            @RequestParam int year,
            @Parameter(description = "월 (1~12)", example = "8")
            @RequestParam int month
    ) {
        Long userId = userDetails.getUser().getId();
        System.out.println(userId);
        return ResponseEntity.ok(
                calendarService.getMonthlyEmotions(userId, year, month)
        );
    }

    @Operation(summary = "일일 질문/답변 상세 조회", description = "로그인된 사용자의 특정 날짜 질문/답변 정보를 조회합니다.")
    @GetMapping("/daily")
    public ResponseEntity<DailyDetailDTO> getDailyDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(description = "날짜", example = "2025-08-06")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long userId = userDetails.getUser().getId();
        return ResponseEntity.ok(
                calendarService.getDailyDetail(userId, date)
        );
    }
}
