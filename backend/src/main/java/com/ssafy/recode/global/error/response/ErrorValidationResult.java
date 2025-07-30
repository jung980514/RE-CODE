package com.ssafy.recode.global.error.response;

import java.util.HashMap;
import java.util.Map;
import lombok.Getter;

/**
 * ErrorValidationResult
 *
 * 유효성 검증 실패(FieldError) 시 응답에 담길 오류 정보를 관리하는 클래스.
 * 각 필드 이름과 오류 메시지를 Map<String, String> 형태로 저장합니다.
 *
 * 예: { "email": "이메일은 필수입니다.", "password": "8자 이상이어야 합니다." }
 */
@Getter
public class ErrorValidationResult {

    // HTTP 상태 코드 (유효성 실패 고정)
    public static final int ERROR_STATUS_CODE = 400;

    // 고정된 메시지 (유효성 실패 공통 메시지)
    public static final String ERROR_MESSAGE = "유효성 검사를 통과하지 못했습니다.";

    // 실제 검증 실패 항목: 필드명 → 오류 메시지
    private final Map<String, String> validation = new HashMap<>();

    /**
     * 유효성 실패 항목 추가 메서드
     *
     * @param fieldName 실패한 필드명 (예: email)
     * @param errorMessage 해당 필드의 오류 메시지
     */
    public void addValidation(String fieldName, String errorMessage) {
        this.validation.put(fieldName, errorMessage);
    }
}
