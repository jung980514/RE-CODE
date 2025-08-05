package com.ssafy.recode.global.dto.request.link;

public record LinkUnlinkRequest(
    Long targetUserId  // 해제하려는 상대방의 userId (보호자가 보내면 elderId, 노인이 보내면 guardianId)
) {}
