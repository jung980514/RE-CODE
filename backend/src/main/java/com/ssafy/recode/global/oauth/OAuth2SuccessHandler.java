package com.ssafy.recode.global.oauth;


import static com.ssafy.recode.global.constant.AuthConstant.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.recode.domain.auth.entity.RefreshToken;
import com.ssafy.recode.domain.auth.service.RefreshTokenService;
import com.ssafy.recode.global.enums.Role;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.security.util.CookieUtils;
import com.ssafy.recode.global.security.util.JWTUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

/**
 * OAuth2SuccessHandler
 *
 * 소셜 로그인(OAuth2) 성공 시 실행되는 핸들러입니다.
 * - Access/Refresh 토큰을 생성하고,
 * - RefreshToken DB 저장 및 쿠키 설정 후,
 * - JSON 응답을 반환합니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JWTUtils jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final ObjectMapper objectMapper;

    /**
     * OAuth2 로그인 성공 시 호출되는 메서드
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2UserImpl oAuth2User = (OAuth2UserImpl) authentication.getPrincipal();
        String uuid = oAuth2User.getUUID();
        String role = getRole(authentication);
        String name = oAuth2User.getName();
        String email = oAuth2User.getUser().getEmail();

        // Refresh Token 존재 여부 확인
        Optional<RefreshToken> findRefreshToken = refreshTokenService.findRefreshToken(oAuth2User.getUser().getId());

        String refreshToken;
        if (findRefreshToken.isEmpty()) {
            // 없으면 새로 생성 및 저장
            refreshToken = jwtUtil.generateRefreshToken(uuid, role, name, email);
            refreshTokenService.addRefreshEntity(refreshToken, uuid, jwtUtil.getRefreshExpiredTime());
        } else {
            // 있으면 기존 값 사용
            refreshToken = findRefreshToken.get().getTokenValue();
        }

        // Access Token은 매번 새로 발급
        String accessToken = jwtUtil.generateAccessToken(uuid, role, name, email);

        log.info("Access Token = {}", accessToken);
        log.info("Refresh Token = {}", refreshToken);

        setInformationInResponse(response, uuid, accessToken, refreshToken);
    }

    /**
     * 쿠키 및 JSON 응답 세팅
     */
    private void setInformationInResponse(HttpServletResponse response, String uuid, String accessToken, String refreshToken) throws IOException {
        Cookie uuidInCookie = CookieUtils.createCookie("uuid", uuid);
        Cookie access = CookieUtils.createCookie(ACCESS_TOKEN, accessToken);
        Cookie refresh = CookieUtils.createCookie(REFRESH_TOKEN, refreshToken);

        response.addCookie(uuidInCookie);
        response.addCookie(access);
        response.addCookie(refresh);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ApiResponse<?> loginApiResponse = ApiResponse.successResponseWithMessage("로그인 처리가 완료되었습니다.", null
        );
        String loginResponse = objectMapper.writeValueAsString(loginApiResponse);

        response.getWriter().write(loginResponse);
        response.setStatus(HttpServletResponse.SC_OK);
        response.sendRedirect("http://localhost:3000/auth/kakao/callback");
    }

    /**
     * Authentication 객체에서 권한(Roles)을 꺼내 반환
     */
    private String getRole(Authentication authentication) {
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
        return iterator.hasNext() ? iterator.next().getAuthority() : Role.USER.toString();
    }
}
