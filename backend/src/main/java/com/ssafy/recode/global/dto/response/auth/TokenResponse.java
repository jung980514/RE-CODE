package com.ssafy.recode.global.dto.response.auth;

public record TokenResponse(
        String accessToken,
        String refreshToken
) {
}
