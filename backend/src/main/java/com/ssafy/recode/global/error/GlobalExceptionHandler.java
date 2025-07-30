package com.ssafy.recode.global.error;

import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.error.response.ErrorResult;
import com.ssafy.recode.global.error.response.ErrorValidationResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * GlobalExceptionHandler
 *
 * 프로젝트 전역에서 발생하는 예외를 처리하는 클래스.
 * ControllerAdvice를 통해 모든 @RestController의 예외를 공통 처리합니다.
 *
 * 유효성 검증 실패 (MethodArgumentNotValidException),
 * 커스텀 예외 (CustomException)를 분리하여 핸들링합니다.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

  /**
   * ❌ 유효성 검증 실패 예외 처리
   *
   * @param e MethodArgumentNotValidException (javax.validation 실패 시 발생)
   * @return 응답: 400 BAD REQUEST + ErrorValidationResult 상세 정보 포함
   */
  @ResponseBody
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<?>> invalidRequestHandler(MethodArgumentNotValidException e) {
    ErrorValidationResult errorValidationResult = new ErrorValidationResult();

    for (FieldError fieldError : e.getBindingResult().getFieldErrors()) {
      errorValidationResult.addValidation(fieldError.getField(), fieldError.getDefaultMessage());
    }

    return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .contentType(MediaType.APPLICATION_JSON)
            .body(ApiResponse.validationErrorResponse(errorValidationResult));
  }

  /**
   * ❌ 사용자 정의 예외(CustomException) 처리
   *
   * @param e CustomException
   * @return 응답: e.getStatusCode() 상태 코드 + 메시지 포함한 JSON
   */
  @ExceptionHandler(CustomException.class)
  public ResponseEntity<ApiResponse<?>> customExceptionHandler(CustomException e) {
    ErrorResult errorResult = new ErrorResult(e.getStatusCode(), e.getMessage());

    return ResponseEntity
            .status(e.getStatusCode())
            .contentType(MediaType.APPLICATION_JSON)
            .body(ApiResponse.errorResponse(errorResult));
  }
}
