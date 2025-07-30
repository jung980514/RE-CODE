package com.ssafy.recode.global.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.recode.domain.auth.entity.RefreshToken;
import com.ssafy.recode.domain.auth.service.RefreshTokenService;
import com.ssafy.recode.global.constant.AuthConstant;
import com.ssafy.recode.global.dto.CustomUserDetails;
import com.ssafy.recode.global.dto.request.LoginRequest;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.error.ErrorCode;
import com.ssafy.recode.global.error.response.ErrorResult;
import com.ssafy.recode.global.security.util.CookieUtils;
import com.ssafy.recode.global.security.util.FilterResponseUtils;
import com.ssafy.recode.global.security.util.JWTUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * JWTLoginFilter
 *
 * 일반 로그인(이메일/비밀번호 기반) 요청을 처리하는 필터.
 * 로그인 성공 시 JWT AccessToken / RefreshToken을 생성하여 쿠키에 저장하고,
 * RefreshToken은 DB에도 저장한다.
 *
 * @author 김영민
 * @since 2025. 7. 28.
 */
@Slf4j
public class JWTLoginFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final JWTUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    public static final String LOGIN_URL = "/api/user/login";

    public JWTLoginFilter(AuthenticationManager authenticationManager,
                          JWTUtils jwtUtils,
                          RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.refreshTokenService = refreshTokenService;

        // 로그인 요청 URL 지정
        setFilterProcessesUrl(LOGIN_URL);
    }

    /**
     * 로그인 요청을 처리하고 인증 토큰을 생성해 AuthenticationManager로 전달
     */
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request,
                                                HttpServletResponse response)
            throws AuthenticationException {
        try {
            // 요청 바디를 LoginRequest 객체로 역직렬화
            LoginRequest loginRequest = objectMapper.readValue(request.getInputStream(), LoginRequest.class);

            // 이메일/비밀번호로 UsernamePasswordAuthenticationToken 생성
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword());

            // AuthenticationManager로 인증 시도
            return authenticationManager.authenticate(authToken);
        } catch (IOException e) {
            throw new RuntimeException("로그인 요청 파싱 실패", e);
        }
    }

    /**
     * 인증 성공 시 JWT 토큰 생성 및 응답 처리
     */
    @Override
    protected void successfulAuthentication(HttpServletRequest request,
                                            HttpServletResponse response,
                                            FilterChain chain,
                                            Authentication authResult)
            throws IOException, ServletException {

        // 인증된 사용자 정보 획득
        CustomUserDetails userDetails = (CustomUserDetails) authResult.getPrincipal();
        String uuid = userDetails.getUUID();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();
        String name = userDetails.getUser().getName();
        String email = userDetails.getUser().getEmail();
        log.info("로그인 성공. UUID: {}", uuid); // 성공 로그 추가

        // Refresh Token 존재 여부 확인
        Optional<RefreshToken> findRefreshToken = refreshTokenService.findRefreshToken(userDetails.getUser().getId());

        String refreshToken;
        if (findRefreshToken.isEmpty()) {
            // 없으면 새로 생성 및 저장
            refreshToken = jwtUtils.generateRefreshToken(uuid, role, name, email);
            refreshTokenService.addRefreshEntity(refreshToken, uuid, jwtUtils.getRefreshExpiredTime());
        } else {
            // 있으면 기존 값 사용
            refreshToken = findRefreshToken.get().getTokenValue();
        }

        // Access Token은 매번 새로 발급
        String accessToken = jwtUtils.generateAccessToken(uuid, role, name, email);

        // 쿠키에 uuid, accessToken, refreshToken 저장
        response.addCookie(CookieUtils.createCookie("uuid", uuid));
        response.addCookie(CookieUtils.createCookie(AuthConstant.ACCESS_TOKEN, accessToken));
        response.addCookie(CookieUtils.createCookie(AuthConstant.REFRESH_TOKEN, refreshToken));

        // 응답 JSON 반환
        ApiResponse<?> loginResponse = new ApiResponse<>("success", 200, "로그인 성공", null);
        FilterResponseUtils.success(response, loginResponse);
    }

    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request,
        HttpServletResponse response, AuthenticationException failed)
        throws IOException, ServletException {
        log.warn("로그인 실패. 원인: {}", failed.getMessage());

        // 실패 원인에 따라 다른 ErrorCode를 사용할 수도 있습니다.
        // 여기서는 일반적인 '인증 실패' 코드를 사용합니다.
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED_USER_ERROR;
        ErrorResult errorResult = new ErrorResult(errorCode.getStatus().value(), errorCode.getMessage());
        ApiResponse<ErrorResult> errorResponse = new ApiResponse<>("fail", errorCode.getStatus().value(), null, errorResult);

        // FilterResponseUtils를 사용하여 에러 응답 전송
        FilterResponseUtils.failure(response, errorCode.getStatus(), errorResponse);
    }
}
