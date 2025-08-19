package com.ssafy.recode.global.dto.response.link;

import com.ssafy.recode.global.enums.LinkStatus;
import java.time.LocalDateTime;

/**
 * 보호자의 연동 요청 정보를 담는 응답 DTO
 */
public record LinkRequestListResponse(
    Long guardianId,
    String guardianName,
    String guardianEmail,
    LinkStatus status,
    LocalDateTime requestedAt
) {}