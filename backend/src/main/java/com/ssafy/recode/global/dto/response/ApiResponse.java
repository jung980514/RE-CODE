package com.ssafy.recode.global.dto.response;

import com.ssafy.recode.global.error.response.ErrorResult;
import com.ssafy.recode.global.error.response.ErrorValidationResult;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * ApiResponse
 *
 * REST API 응답을 일관되게 관리하기 위한 공통 응답 DTO 클래스.
 * 상태(status), HTTP 코드, 메시지, 데이터 필드를 포함하며,
 * 성공/실패/에러 응답을 정적 팩토리 메서드로 생성합니다.
 *
 * @param <T> 응답 데이터의 타입
 */
@Getter
@Builder
@RequiredArgsConstructor
public class ApiResponse<T> {

    // ✅ 상태 코드 문자열 상수
    public static final String SUCCESS = "success"; // 성공
    public static final String FAIL = "fail";       // 유효성 실패
    public static final String ERROR = "error";     // 서버 오류 등 일반 실패

    private final String status; // 응답 상태 (success, fail, error)
    private final int code;      // HTTP 상태 코드
    private final String message; // 응답 메시지
    private final T data;         // 실제 응답 데이터

    /**
     * ✅ 일반 성공 응답 (200 OK)
     * @param data 응답 데이터
     * @return ApiResponse 객체
     */
    public static <T> ApiResponse<?> successResponse(T data) {
        return new ApiResponse<>(SUCCESS, HttpStatus.OK.value(), null, data);
    }

    /**
     * ✅ 메시지가 포함된 성공 응답 (200 OK)
     * @param message 응답 메시지
     * @param data 응답 데이터
     * @return ApiResponse 객체
     */
    public static <T> ApiResponse<?> successResponseWithMessage(String message, T data) {
        return new ApiResponse<>(SUCCESS, HttpStatus.OK.value(), message, data);
    }

    /**
     * ✅ 생성 성공 응답 (201 Created)
     * @param data 생성된 리소스 데이터
     * @return ApiResponse 객체
     */
    public static <T> ApiResponse<?> createResponse(T data) {
        return new ApiResponse<>(SUCCESS, HttpStatus.CREATED.value(), null, data);
    }

    /**
     * ❌ 유효성 검증 실패 응답 (400 Bad Request)
     * - ErrorValidationResult로부터 바인딩 오류 데이터 포함
     * @param e ErrorValidationResult 객체
     * @return ApiResponse 객체
     */
    public static ApiResponse<?> validationErrorResponse(ErrorValidationResult e) {
        return new ApiResponse<>(FAIL,
                ErrorValidationResult.ERROR_STATUS_CODE,
                ErrorValidationResult.ERROR_MESSAGE,
                e.getValidation());
    }

    /**
     * ❌ 서버 오류 또는 일반 실패 응답
     * - ErrorResult에는 상태 코드와 메시지 포함됨
     * @param error ErrorResult 객체
     * @return ApiResponse 객체
     */
    public static ApiResponse<?> errorResponse(ErrorResult error) {
        return new ApiResponse<>(ERROR,
                error.getStatusCode(),
                error.getMessage(),
                null);
    }
}
