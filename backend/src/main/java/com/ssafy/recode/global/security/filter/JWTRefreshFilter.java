package com.ssafy.recode.global.security.filter;

import com.ssafy.recode.domain.auth.repository.RefreshTokenRepository;
import com.ssafy.recode.global.constant.AuthConstant;
import com.ssafy.recode.global.error.ErrorCode;
import com.ssafy.recode.global.security.util.CookieUtils;
import com.ssafy.recode.global.security.util.FilterResponseUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWTRefreshFilter
 *
 * /api/user/reissue 요청에 대해 쿠키에서 RefreshToken을 추출하여 유효성 검사 후
 * request 속성에 저장해주는 필터입니다.
 * - 리프레시 토큰이 유효하지 않으면 요청을 차단하고 에러 응답을 반환합니다.
 * - 유효한 경우 request.setAttribute()로 토큰을 다음 단계에 전달합니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@RequiredArgsConstructor
@Slf4j
public class JWTRefreshFilter extends OncePerRequestFilter {

    private final RefreshTokenRepository refreshRepository;
    private final FilterResponseUtils filterResponseUtils;

    /**
     * /api/user/reissue 요청에 대해 RefreshToken 쿠키를 검증하고
     * 유효할 경우 request attribute에 저장합니다.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();

        // 리프레시 요청이 아니면 다음 필터로 넘김
        if (!isUrlRefresh(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 쿠키에서 RefreshToken 추출
        String refresh = CookieUtils.checkRefreshTokenInCookie(request);

        if (refresh == null) {
            filterResponseUtils.generateTokenErrorResponse(ErrorCode.TOKEN_ERROR, response);
            return;
        }

        // 토큰이 DB에 존재하지 않음
        if (!filterResponseUtils.isTokenInDB(response, refresh)) {
            return;
        }

        // 만료된 토큰 → DB에서 삭제
        if (filterResponseUtils.isTokenExpired(response, refresh)) {
            refreshRepository.deleteByTokenValue(refresh);
            return;
        }

        // 토큰 타입이 refresh가 아니면 차단
        if (!filterResponseUtils.checkTokenType(response, refresh, AuthConstant.REFRESH_TOKEN)) {
            return;
        }

        // 유효한 토큰 → request에 저장
        request.setAttribute(AuthConstant.REFRESH_TOKEN, refresh);

        filterChain.doFilter(request, response);
    }

    /**
     * /api/user/reissue 또는 하위 경로인지 확인
     * 예: /api/user/reissue, /api/user/reissue/renew
     */
    private boolean isUrlRefresh(String requestUri) {
        return requestUri.matches("^/api/user/reissue(?:/.*)?$");
    }
}
