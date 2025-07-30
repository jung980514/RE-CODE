package com.ssafy.recode.global.error;

/**
 * CustomException
 *
 * 비즈니스 로직에서 발생할 수 있는 커스텀 예외 클래스.
 * ErrorCode Enum을 통해 상태 코드 및 메시지를 일관되게 관리합니다.
 *
 * 예외 처리 시 GlobalExceptionHandler와 함께 사용됩니다.
 */
public class CustomException extends RuntimeException {

    // 예외 코드 및 상태 정보를 담은 enum
    private final ErrorCode errorCode;

    /**
     * CustomException 생성자
     *
     * @param errorCode 사전에 정의된 예외 코드 Enum
     */
    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMessage()); // 부모 클래스(RuntimeException)에 메시지 전달
        this.errorCode = errorCode;
    }

    /**
     * 예외 메시지 반환 (상속 메서드 재정의)
     *
     * @return 예외 메시지 문자열
     */
    @Override
    public String getMessage() {
        return super.getMessage();
    }

    /**
     * 예외에 대응하는 HTTP 상태 코드 반환
     *
     * @return HTTP 상태 코드 (ex. 400, 404, 500)
     */
    public int getStatusCode() {
        return errorCode.getStatus().value();
    }
}
