package com.ssafy.recode.global.dto.response.link;

import java.time.LocalDateTime;

public record GuardianSummaryResponse(
    Long id,
    String name,
    String phone,
    LocalDateTime createdAt
) {

}
