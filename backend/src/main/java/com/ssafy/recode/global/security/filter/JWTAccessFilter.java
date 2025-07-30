package com.ssafy.recode.global.security.filter;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.global.constant.AuthConstant;
import com.ssafy.recode.global.dto.CustomUserDetails;
import com.ssafy.recode.global.dto.Role;
import com.ssafy.recode.global.error.ErrorCode;
import com.ssafy.recode.global.security.util.CookieUtils;
import com.ssafy.recode.global.security.util.FilterResponseUtils;
import com.ssafy.recode.global.security.util.JWTUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWTAccessFilter
 *
 * Spring Security의 OncePerRequestFilter를 확장하여 AccessToken 인증을 수행합니다.
 * - 인증이 필요한 요청의 JWT를 검증하고,
 * - 유효할 경우 SecurityContext에 인증 정보(Authentication)를 저장합니다.
 * - 로그인, 소셜 로그인, 토큰 재발급 요청은 필터에서 제외합니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@RequiredArgsConstructor
@Slf4j
public class JWTAccessFilter extends OncePerRequestFilter {

    private final JWTUtils jwtUtils;
    private final FilterResponseUtils filterResponseUtils;

    /**
     * 요청마다 JWT 토큰을 검사하고, 유효한 경우 인증 정보를 SecurityContext에 등록합니다.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();

        if(uri.matches("/index.html")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 인증 제외 대상 경로
        if (isUrlLogin(uri) || isUrlOAuth2(uri) || isReissue(uri)) {
            filterChain.doFilter(request, response);
            return;
        }


        //쿠키에서 토큰값 추출
        String token = CookieUtils.checkAccessTokenInCookie(request);
        // 쿠키가 없으면 401 에러
        if (checkCookie(token)) {
            log.info("Access Token Not Exist");
            filterResponseUtils.generateUnAuthorizationErrorResponse(ErrorCode.UNAUTHORIZED_USER_ERROR, response);
            return;
        }

        // 토큰 만료 여부 검사
        if (filterResponseUtils.isTokenExpired(response, token)) return;

        // access 타입인지 확인
        if (!filterResponseUtils.checkTokenType(response, token, AuthConstant.ACCESS_TOKEN)) return;

        // 토큰에서 사용자 정보 추출
        String uuid = jwtUtils.getUUID(token);
        String role = jwtUtils.getRole(token);
        String name = jwtUtils.getName(token);
        String email = jwtUtils.getEmail(token);

        // User 객체 생성
        User user = User
                .authBuilder()
                .uuid(uuid)
                .role(Role.valueOf(role))
                .name(name)
                .email(email)
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(user);

        // 인증 객체 생성
//        Collection<GrantedAuthority> authorities = getGrantedAuthorities(token);

        Authentication authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        log.info("✅ JWT Filter 인증 완료: {}", authToken);

        // SecurityContext에 인증 정보 등록
        SecurityContextHolder.getContext().setAuthentication(authToken);

        // 다음 필터로 요청 전달
        filterChain.doFilter(request, response);
    }

    /**
     * 토큰에서 역할(Role)을 꺼내 권한 정보로 변환
     */
    private Collection<GrantedAuthority> getGrantedAuthorities(String token) {
        String role = jwtUtils.getRole(token);
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(role));
        return authorities;
    }

    /**
     * 쿠키에서 access_token이 null이면 true
     */
    private boolean checkCookie(String token) {
        return token == null;
    }

    /**
     * Authorization 헤더가 null이거나 Bearer로 시작하지 않으면 true
     */
    private boolean checkHeader(String authorization) {
        return authorization == null || !authorization.startsWith(AuthConstant.BEARER);
    }

    /**
     * 로그인 관련 경로는 필터 적용 제외
     */
    private boolean isUrlLogin(String requestUri) {
        return requestUri.matches("^\\/api/user\\/(login|register)$") || requestUri.matches("/api/user/login/page");
    }

    /**
     * OAuth2 경로는 필터 적용 제외
     */
    private boolean isUrlOAuth2(String requestUri) {
        return requestUri.matches("^\\/oauth2(?:\\/.*)?$");
    }

    /**
     * 리프레시 토큰 재발급 경로는 필터 적용 제외
     */
    private boolean isReissue(String requestUri) {
        return requestUri.matches("^\\/api/reissue(?:\\/.*)?$");
    }
}
