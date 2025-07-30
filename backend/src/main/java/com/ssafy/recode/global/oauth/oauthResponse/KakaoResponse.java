package com.ssafy.recode.global.oauth.oauthResponse;

import java.util.Map;

/**
 * KakaoResponse
 *
 * 카카오 OAuth2 로그인 응답에서 사용자 정보를 추출하는 클래스.
 * OAuth2Response 인터페이스를 구현하여 provider, email, nickname, providerId를 반환합니다.
 *
 * 카카오 API 구조는 다음과 같습니다:
 * {
 *   "id": "123456789",
 *   "kakao_account": {
 *     "email": "user@kakao.com",
 *     "profile": {
 *       "nickname": "홍길동"
 *     }
 *   }
 * }
 */
public class KakaoResponse implements OAuth2Response {

    private final Map<String, Object> attribute;

    /**
     * Kakao OAuth 응답 전체를 받아 내부적으로 필요한 필드를 추출합니다.
     * @param attribute 카카오에서 내려준 사용자 정보 Map
     */
    public KakaoResponse(Map<String, Object> attribute) {
        this.attribute = attribute;
    }

    /**
     * OAuth 공급자 이름
     * @return "kakao"
     */
    @Override
    public String getProvider() {
        return "kakao";
    }

    /**
     * 고유 사용자 식별자 (카카오 id)
     * @return String 타입의 사용자 ID
     */
    @Override
    public String getProviderId() {
        return attribute.get("id").toString();
    }

    /**
     * 사용자 이메일 주소
     * @return 카카오 계정 이메일
     */
    @Override
    public String getEmail() {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attribute.get("kakao_account");
        return (String) kakaoAccount.get("email");
    }

    /**
     * 사용자 닉네임 (카카오 프로필의 nickname)
     * @return 사용자 닉네임
     */
    @Override
    public String getName() {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attribute.get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
        return (String) profile.get("nickname");
    }
}
