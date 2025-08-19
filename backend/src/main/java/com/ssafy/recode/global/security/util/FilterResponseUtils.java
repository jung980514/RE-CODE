package com.ssafy.recode.global.security.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.recode.domain.auth.repository.RefreshTokenRepository;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.error.ErrorCode;
import com.ssafy.recode.global.error.response.ErrorResult;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * FilterResponseUtils
 *
 * Security Filter에서 JWT 유효성 검사 및 오류 발생 시 JSON 에러 응답을 처리하는 유틸 클래스.
 * - 토큰 만료 여부 확인
 * - 토큰 형식 오류 감지
 * - 토큰 타입 검증(access, refresh 구분)
 * - DB 존재 여부 확인
 * - JSON 에러 응답 생성
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FilterResponseUtils {

    private final JWTUtils jwtUtils;
    private final ObjectMapper objectMapper;
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * JWT 토큰의 만료 여부를 검사하고, 만료되었을 경우 JSON 에러 응답을 반환합니다.
     *
     * @param response HttpServletResponse
     * @param token 검사 대상 토큰
     * @return true: 만료 또는 오류 발생 / false: 정상
     */
    public boolean isTokenExpired(HttpServletResponse response, String token) {
        try {
            jwtUtils.isExpired(token);
        } catch (ExpiredJwtException e) {
            generateTokenErrorResponse(ErrorCode.TOKEN_EXPIRED_ERROR, response);
            return true;
        } catch (MalformedJwtException e) {
            generateTokenErrorResponse(ErrorCode.TOKEN_MALFORMED_ERROR, response);
            return true;
        } catch (UnsupportedJwtException e) {
            generateTokenErrorResponse(ErrorCode.TOKEN_UNSUPPORTED_ERROR, response);
            return true;
        } catch (SignatureException e) {
            generateTokenErrorResponse(ErrorCode.TOKEN_SIGNATURE_ERROR, response);
            return true;
        } catch (Exception e) {
            generateTokenErrorResponse(ErrorCode.TOKEN_ERROR, response);
            return true;
        }
        return false;
    }

    /**
     * 토큰에 담긴 "category" 클레임이 기대한 타입(access/refresh)과 일치하는지 검사합니다.
     *
     * @param response HttpServletResponse
     * @param token 검사 대상 토큰
     * @param type 기대하는 타입 ("access" 또는 "refresh")
     * @return true: 일치함 / false: 불일치 (오류 응답 반환됨)
     */
    public boolean checkTokenType(HttpServletResponse response, String token, String type) {
        String category = jwtUtils.getCategory(token);
        if (!category.equals(type)) {
            generateTokenErrorResponse(ErrorCode.TOKEN_ERROR, response);
            return false;
        }
        return true;
    }

    /**
     * 토큰 오류 발생 시 JSON 에러 응답을 반환합니다 (HTTP 400).
     *
     * @param errorCode ErrorCode
     * @param response HttpServletResponse
     */
    public void generateTokenErrorResponse(ErrorCode errorCode, HttpServletResponse response) {
        ErrorResult errorResult = new ErrorResult(errorCode.getStatus().value(), errorCode.getMessage());
        setErrorResponseInFilter(response, HttpServletResponse.SC_BAD_REQUEST, errorResult);
    }

    /**
     * 인증 오류 발생 시 JSON 에러 응답을 반환합니다 (HTTP 401).
     *
     * @param errorCode ErrorCode
     * @param response HttpServletResponse
     */
    public void generateUnAuthorizationErrorResponse(ErrorCode errorCode, HttpServletResponse response) {
        ErrorResult errorResult = new ErrorResult(errorCode.getStatus().value(), errorCode.getMessage());
        setErrorResponseInFilter(response, HttpServletResponse.SC_UNAUTHORIZED, errorResult);
    }

    /**
     * 전달받은 토큰이 DB(RefreshTokenRepository)에 존재하는지 확인합니다.
     *
     * @param response HttpServletResponse
     * @param token 검사 대상 리프레시 토큰
     * @return true: 존재함 / false: 존재하지 않음 (오류 응답 반환됨)
     */
    public boolean isTokenInDB(HttpServletResponse response, String token) {
        boolean isExist = refreshTokenRepository.existsByTokenValue(token);
        if (!isExist) {
            generateTokenErrorResponse(ErrorCode.TOKEN_ERROR, response);
            return false;
        }
        return true;
    }

    /**
     * 필터 레벨에서 JSON 응답을 직접 작성하여 클라이언트에게 에러를 반환합니다.
     *
     * @param response        HttpServletResponse
     * @param responseStatus  HTTP 상태 코드
     * @param errorResult     응답에 포함될 에러 내용
     */
    private void setErrorResponseInFilter(HttpServletResponse response, int responseStatus, ErrorResult errorResult) {
        try {
            String errorResponse = objectMapper.writeValueAsString(ApiResponse.errorResponse(errorResult));
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(errorResponse);
            response.setStatus(responseStatus);
        } catch (IOException e) {
            log.error("IOException 발생 - 에러 응답 실패", e);
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        }
    }

    public static void success(HttpServletResponse response, ApiResponse<?> apiResponse)
        throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(new ObjectMapper().writeValueAsString(apiResponse));
    }

    public static void failure(HttpServletResponse response, HttpStatus httpStatus, Object body)
        throws IOException {
        response.setStatus(httpStatus.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(new ObjectMapper().writeValueAsString(body));
    }
}
