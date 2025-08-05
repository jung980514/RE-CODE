package com.ssafy.recode.global.dto.request.link;

public record LinkApprovalRequest(
    Long guardianId,
    String token,
    boolean approve  // true: 수락, false: 거절
) {}