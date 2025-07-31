package com.ssafy.recode.global.security.util;

import static com.ssafy.recode.global.constant.AuthConstant.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * CookieUtils
 *
 * 리프레시 토큰을 쿠키로 주고받기 위한 유틸리티 클래스.
 * - 쿠키 생성
 * - 쿠키 제거
 * - 요청에서 쿠키 조회
 */
@Slf4j
public class CookieUtils {

    /**
     * 주어진 key-value로 쿠키를 생성
     * - path는 루트("/")로 설정
     * - HttpOnly 옵션 활성화
     * - Secure 옵션은 프로덕션에서 HTTPS로 사용할 경우 주석 해제 필요
     *
     * @param key 쿠키 이름
     * @param value 쿠키 값
     * @return 생성된 Cookie 객체
     */
    public static Cookie createCookie(String key, String value) {
        Cookie cookie = new Cookie(key, value);

        cookie.setMaxAge(60 * 60);     // 1시간 (초 단위)
        cookie.setSecure(true);     // HTTPS 사용 시 활성화 (배포 환경에서 권장)
        cookie.setPath("/");           // 전체 경로에서 쿠키 접근 가능
        cookie.setHttpOnly(true);      // JS에서 접근 불가 (보안 강화)

        return cookie;
    }

    /**
     * 리프레시 토큰 쿠키를 클라이언트에서 제거합니다.
     * - MaxAge 0 설정
     * - response에 쿠키 다시 설정
     * - 상태 코드는 200 OK로 지정
     *
     * @param response HttpServletResponse
     */
    public static void clearCookie(HttpServletResponse response) {
        Cookie refreshCookie = new Cookie(REFRESH_TOKEN, null);
        refreshCookie.setMaxAge(0); // 즉시 만료
        refreshCookie.setPath("/");
        response.addCookie(refreshCookie);

        Cookie accessCookie = new Cookie(ACCESS_TOKEN, null);
        accessCookie.setMaxAge(0); // 즉시 만료
        accessCookie.setPath("/");
        response.addCookie(accessCookie);

        Cookie uuidCookie = new Cookie(UUID, null);
        uuidCookie.setMaxAge(0); // 즉시 만료
        uuidCookie.setPath("/");
        response.addCookie(uuidCookie);

        response.setStatus(HttpServletResponse.SC_OK);
    }

    /**
     * HttpServletRequest에서 REFRESH_TOKEN 이름의 쿠키 값을 추출합니다.
     *
     * @param request HttpServletRequest
     * @return 쿠키 값 (없으면 null)
     */
    public static String checkRefreshTokenInCookie(HttpServletRequest request) {
        String refresh = null;
        Cookie[] cookies = request.getCookies();

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(REFRESH_TOKEN)) {
                    refresh = cookie.getValue();
                    break;
                }
            }
        }

        return refresh;
    }

    /**
     * HttpServletRequest에서 ACCESS_TOKEN 이름의 쿠키 값을 추출합니다.
     *
     * @param request HttpServletRequest
     * @return 쿠키 값 (없으면 null)
     */
    public static String checkAccessTokenInCookie(HttpServletRequest request) {
        String refresh = null;
        Cookie[] cookies = request.getCookies();

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(ACCESS_TOKEN)) {
                    refresh = cookie.getValue();
                    break;
                }
            }
        }

        return refresh;
    }
}
