package com.ssafy.recode.global.error.response;

import lombok.Getter;

/**
 * ErrorResult
 *
 * 일반적인 서버 오류나 비즈니스 예외 발생 시,
 * 상태 코드와 메시지를 포함한 에러 응답 데이터를 전달하는 DTO입니다.
 *
 * 예: {
 *   "status": "error",
 *   "code": 500,
 *   "message": "내부 서버 오류가 발생했습니다."
 * }
 */
@Getter
public class ErrorResult {

    // HTTP 상태 코드 (예: 400, 404, 500 등)
    private final int statusCode;

    // 오류 메시지 (사용자에게 전달될 에러 설명)
    private final String message;

    /**
     * ErrorResult 생성자
     *
     * @param statusCode HTTP 상태 코드
     * @param message 에러 메시지
     */
    public ErrorResult(int statusCode, String message) {
        this.statusCode = statusCode;
        this.message = message;
    }
}
