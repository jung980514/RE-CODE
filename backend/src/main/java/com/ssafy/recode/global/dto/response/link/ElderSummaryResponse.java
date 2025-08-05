package com.ssafy.recode.global.dto.response.link;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ElderSummaryResponse(
    Long id,
    String name,
    LocalDate birthDate,
    String phone,
    LocalDateTime createdAt
) {

}
