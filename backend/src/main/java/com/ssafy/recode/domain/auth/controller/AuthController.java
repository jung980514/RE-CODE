package com.ssafy.recode.domain.auth.controller;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.service.AuthService;
import com.ssafy.recode.domain.auth.service.RefreshTokenService;
import com.ssafy.recode.domain.basic.service.BasicService;
import com.ssafy.recode.domain.cognitive.service.CognitiveService;
import com.ssafy.recode.domain.personal.service.PersonalService;
import com.ssafy.recode.domain.survey.service.SurveyService;
import com.ssafy.recode.global.constant.AuthConstant;
import com.ssafy.recode.global.dto.request.DeleteUserRequest;
import com.ssafy.recode.global.dto.request.RegisterRequest;
import com.ssafy.recode.global.dto.request.UpdateUserRequest;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.security.annotation.LoginUser;
import com.ssafy.recode.global.security.util.CookieUtils;
import com.ssafy.recode.global.security.util.JWTUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
    private final SurveyService surveyService;
    private final BasicService basicService;
    private final CognitiveService cognitiveService;
    private final PersonalService personalService;;

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
            .body(ApiResponse.successResponse("토큰이 정상적으로 재발급 되었습니다."));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // JWTLogoutFilter에서 쿠키 삭제 및 토큰 무효화 처리가 이미 수행됨
        // 이 컨트롤러는 클라이언트에게 정상적인 로그아웃 응답을 보내는 역할만 함
        return ResponseEntity.ok(ApiResponse.successResponse("로그아웃이 성공적으로 처리되었습니다."));
    }
    @PatchMapping("/update")
    public ResponseEntity<?> updateUser(
        @LoginUser User user,
        @RequestBody @jakarta.validation.Valid UpdateUserRequest request
    ) {
      User updated = authService.updateUser(user.getId(), request);
      return ResponseEntity.ok(ApiResponse.successResponse(updated)); // 필요 시 UserResponse로 변환
    }

    @DeleteMapping()
    public ResponseEntity<?> deleteUser(
        @LoginUser User user,
        @RequestBody(required = false) DeleteUserRequest request,
        HttpServletResponse response
    ) {
      if (request == null) request = new DeleteUserRequest();
      authService.deleteUser(user.getId(), request);
      CookieUtils.clearCookie(response);
      return ResponseEntity.ok(ApiResponse.successResponse("회원 탈퇴가 완료되었습니다."));
    }
    /**
     * 오늘 일일 설문을 진행했는지 체크
     */
    @GetMapping("/daily-survey")
    public ResponseEntity<?> isDailySurveyCompleted(@LoginUser User user) {
        return ResponseEntity.ok(ApiResponse.successResponse(surveyService.hasCompletedDailySurvey(user.getId())));
    }

    /**
     * 기초/인지-소리/인지-이미지/개인화 질문 당일 답변 여부
     */
    @GetMapping("/status")
    public ResponseEntity<?> getTodayCompletionStatus(
            @LoginUser User user
    ) {
        Long userId = user.getId();
        boolean basicDone = basicService.isBasicCompleted(userId);
        boolean cognitiveAudio = cognitiveService.isCognitiveCompleted(userId, "audio");
        boolean cognitiveImage = cognitiveService.isCognitiveCompleted(userId, "image");
        boolean personalDone = personalService.isPersonalCompleted(userId);

        Map<String, Boolean> statusMap = new LinkedHashMap<>();
        statusMap.put("basic",       basicDone);
        statusMap.put("cognitiveAudio",  cognitiveAudio);
        statusMap.put("cognitiveImage",  cognitiveImage);
        statusMap.put("personal",    personalDone);

        return ResponseEntity.ok(ApiResponse.successResponse((statusMap)));
    }

}
