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
    DUPLICATE_PHONE(HttpStatus.BAD_REQUEST, "이미 사용 중인 전화번호입니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "비밀번호가 올바르지 않습니다."),
    SOCIAL_ACCOUNT_PASSWORD_CHANGE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "소셜 계정은 비밀번호를 변경할 수 없습니다."),
    SAME_AS_OLD_PASSWORD(HttpStatus.BAD_REQUEST, "새 비밀번호가 기존 비밀번호와 동일합니다."),

    //DATE
    DATE_INVALID_ERROR(HttpStatus.BAD_REQUEST, "날짜가 유효하지 않습니다."),

    //SINGUP
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, "이미 가입되어있는 이메일입니다."),
    DUPLICATE_KAKAO_EMAIL(HttpStatus.BAD_REQUEST, "이미 카카오 계정으로 가입된 이메일입니다. 카카오 로그인을 이용해주세요."),

    //ROLE
    LINK_TOKEN_INVALID(HttpStatus.BAD_REQUEST, "유효하지 않은 토큰입니다."),
    LINK_ALREADY_REQUESTED(HttpStatus.CONFLICT, "이미 연동 요청을 보낸 사용자입니다."),
    ROLE_GUARDIAN_ONLY_ACCESS_ERROR(HttpStatus.FORBIDDEN, "보호자만 사용할 수 있는 기능입니다."),
    ROLE_ELDER_ONLY_ACCESS_ERROR(HttpStatus.FORBIDDEN, "해당 기능은 노인 사용자만 사용할 수 있습니다."),
    LINK_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 연동 요청을 찾을 수 없습니다."),
    LINK_NOT_FOUND(HttpStatus.NOT_FOUND, "연동된 관계를 찾을 수 없습니다."),
    LINK_ALREADY_RESPONDED(HttpStatus.BAD_REQUEST, "이미 처리된 연동 요청입니다.");

    private final HttpStatus status;
    private final String message;

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}