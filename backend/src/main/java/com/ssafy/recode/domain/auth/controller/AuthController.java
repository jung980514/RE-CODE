package com.ssafy.recode.domain.auth.controller;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.service.AuthService;
import com.ssafy.recode.domain.auth.service.RefreshTokenService;
import com.ssafy.recode.global.constant.AuthConstant;
import com.ssafy.recode.global.dto.request.RegisterRequest;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.dto.response.auth.TokenResponse;
import com.ssafy.recode.global.security.annotation.LoginUser;
import com.ssafy.recode.global.security.util.CookieUtils;
import com.ssafy.recode.global.security.util.JWTUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AuthController
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class AuthController {

    private final AuthService authService;

    private final JWTUtils jwtUtil;

    private final RefreshTokenService refreshTokenService;

    @GetMapping
    public ResponseEntity<?> getUser(@LoginUser User user) {
        return ResponseEntity.ok(ApiResponse.successResponse(user));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.successResponse("회원가입이 완료되었습니다."));
    }

    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<?>> reissue(
        HttpServletRequest request, HttpServletResponse response,
        @LoginUser User user) {

        String refresh = (String) request.getAttribute(AuthConstant.REFRESH_TOKEN);

        Map<String, String> jwtInformation = jwtUtil.getJWTInformation(refresh);

        String uuid = jwtInformation.get(AuthConstant.UUID);
        String role = jwtInformation.get(AuthConstant.ROLE);
        String name = user.getName();
        String email = user.getEmail();

        String newAccess = jwtUtil.generateAccessToken(uuid, role, name, email);
        String newRefresh = jwtUtil.generateRefreshToken(uuid, role, name, email);

        refreshTokenService.renewalRefreshToken(refresh, newRefresh, jwtUtil.getRefreshExpiredTime());

        response.addCookie(CookieUtils.createCookie(AuthConstant.ACCESS_TOKEN, newAccess));
        response.addCookie(CookieUtils.createCookie(AuthConstant.REFRESH_TOKEN, newRefresh));

        return ResponseEntity.status(HttpStatus.OK)
            .contentType(MediaType.APPLICATION_JSON)
            .body(ApiResponse.successResponseWithMessage("토큰이 정상적으로 재발급 되었습니다.", new TokenResponse(newAccess, newRefresh)
            ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // JWTLogoutFilter에서 쿠키 삭제 및 토큰 무효화 처리가 이미 수행됨
        // 이 컨트롤러는 클라이언트에게 정상적인 로그아웃 응답을 보내는 역할만 함
        return ResponseEntity.ok(ApiResponse.successResponse("로그아웃이 성공적으로 처리되었습니다."));
    }

}
