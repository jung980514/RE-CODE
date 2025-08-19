package com.ssafy.recode.global.security.filter;

import com.ssafy.recode.domain.auth.repository.RefreshTokenRepository;
import com.ssafy.recode.global.constant.AuthConstant;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.error.ErrorCode;
import com.ssafy.recode.global.security.util.CookieUtils;
import com.ssafy.recode.global.security.util.FilterResponseUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.AllArgsConstructor;
import org.springframework.web.filter.GenericFilterBean;

/**
 * JWTLogoutFilter
 *
 * 로그아웃 요청 시 RefreshToken을 검증 후 DB에서 삭제하고,
 * 관련 쿠키를 제거하는 로그아웃 전용 커스텀 필터입니다.
 * - POST /api/user/logout 만 필터 대상으로 작동합니다.
 * - RefreshToken은 Cookie에서 추출됩니다.
 * - 토큰이 DB에 없거나 만료되었으면 삭제만 수행합니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@AllArgsConstructor
public class JWTLogoutFilter extends GenericFilterBean {

    private final RefreshTokenRepository refreshRepository;
    private final FilterResponseUtils filterResponseUtils;

    /**
     * GenericFilterBean의 doFilter 메서드 오버라이드
     */
    @Override
    public void doFilter(ServletRequest request,
                         ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {

        doFilter((HttpServletRequest) request, (HttpServletResponse) response, chain);
    }

    /**
     * 실제 필터 로직 수행 메서드
     * - /api/user/logout 경로이면서 POST 요청일 때만 작동
     * - 쿠키에서 RefreshToken 추출 후 DB 검증 → 삭제
     */
    private void doFilter(HttpServletRequest request,
                          HttpServletResponse response,
                          FilterChain filterChain) throws IOException, ServletException {

        // 로그아웃 URL이 아니면 다음 필터로 전달
        if (!isUrlLogout(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 로그아웃은 POST 요청만 허용
        if (!isHttpMethodPost(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 쿠키에서 RefreshToken 꺼냄
        String refresh = CookieUtils.checkRefreshTokenInCookie(request);

        // 쿠키에 토큰이 없으면 에러 응답
        if (refresh == null) {
            filterResponseUtils.generateTokenErrorResponse(ErrorCode.TOKEN_ERROR, response);
            return;
        }

        // 토큰이 DB에 존재하지 않으면 에러 응답
        if (!filterResponseUtils.isTokenInDB(response, refresh)) {
            return;
        }

        // 토큰이 만료되었으면 삭제만 하고 종료
        if (filterResponseUtils.isTokenExpired(response, refresh)) {
            refreshRepository.deleteByTokenValue(refresh);
            return;
        }

        // 토큰이 refresh 타입인지 확인
        if (!filterResponseUtils.checkTokenType(response, refresh, AuthConstant.REFRESH_TOKEN)) {
            return;
        }

        // 최종적으로 DB에서 리프레시 토큰 삭제
        refreshRepository.deleteByTokenValue(refresh);

        // 쿠키 제거
        CookieUtils.clearCookie(response);

        ApiResponse<?> successResponse = new ApiResponse<>("success", 200, "로그아웃이 성공적으로 처리되었습니다.", null);
        FilterResponseUtils.success(response, successResponse);
        // 다음 필터로 전달
//        filterChain.doFilter(request, response);
    }

    /**
     * HTTP 메서드가 POST인지 검사
     */
    private boolean isHttpMethodPost(String requestMethod) {
        return requestMethod.equals("POST");
    }

    /**
     * 로그아웃 요청인지 확인 (/api/user/logout 경로)
     */
    private boolean isUrlLogout(String requestUri) {
        return requestUri.matches("^/api/user/logout$");
    }
}
