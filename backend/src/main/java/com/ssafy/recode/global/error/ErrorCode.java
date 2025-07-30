package com.ssafy.recode.global.error;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@RequiredArgsConstructor
public enum ErrorCode {
    //AUTH
    UNAUTHORIZED_USER_ERROR(HttpStatus.UNAUTHORIZED, "인증 되지 않은 사용자 입니다."),
    USER_NOT_FOUND_ERROR(HttpStatus.NOT_FOUND, "존재하지 않는 유저입니다. 유저를 찾을 수 없습니다."),
    TOKEN_EXPIRED_ERROR(HttpStatus.BAD_REQUEST, "토큰이 만료되었습니다."),
    TOKEN_MALFORMED_ERROR(HttpStatus.BAD_REQUEST, "올바른 Token 형식이 아닙니다."),
    TOKEN_UNSUPPORTED_ERROR(HttpStatus.BAD_REQUEST, "지원하지 않는 Token 입니다."),
    TOKEN_SIGNATURE_ERROR(HttpStatus.BAD_REQUEST, "Token 의 서명이 유효하지 않습니다."),
    TOKEN_ERROR(HttpStatus.BAD_REQUEST, "잘못된 Token 입니다."),

    //DATE
    DATE_INVALID_ERROR(HttpStatus.BAD_REQUEST, "날짜가 유효하지 않습니다."),

    //SINGUP
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, "이미 가입되어있는 이메일입니다."),
    DUPLICATE_KAKAO_EMAIL(HttpStatus.BAD_REQUEST, "이미 카카오 계정으로 가입된 이메일입니다. 카카오 로그인을 이용해주세요.");

    private final HttpStatus status;
    private final String message;

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}