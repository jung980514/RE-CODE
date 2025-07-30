package com.ssafy.recode.global.security.util;


import static com.ssafy.recode.global.constant.AuthConstant.*;

import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * JWTUtils
 *
 * JWT(Json Web Token) 생성 및 파싱을 담당하는 유틸리티 클래스.
 * AccessToken/RefreshToken 생성, 정보 추출, 만료 검사를 지원함.
 *
 * @author 김영민
 * @since 2025-07-26
 */
@Component
public class JWTUtils {

    // 🔐 JWT 서명용 비밀키
    private final SecretKey secretKey;

    // ⏱️ AccessToken 만료 시간: 24시간 (ms 단위)
    private final Long accessExpiredTime = 60 * 60 * 24 * 1000L;

    // ⏱️ RefreshToken 만료 시간: 48시간 (ms 단위)
    private final Long refreshExpiredTime = 60 * 60 * 48 * 1000L;

    /**
     * JWT 시크릿 키를 초기화하는 생성자
     * @param secret JWT 서명용 비밀키
     */
    public JWTUtils(@Value("${spring.jwt.secret}") String secret) {
        // 시크릿 키를 HS256 방식으로 변환
        secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),
                Jwts.SIG.HS256.key().build().getAlgorithm());
    }

    /**
     * AccessToken 생성 메서드
     * @param uuid 사용자 식별자
     * @param role 사용자 권한(ELDER, GUARDIAN 등)
     * @return JWT 형식의 AccessToken 문자열
     */
    public String generateAccessToken(String uuid, String role, String name, String email) {
        return Jwts.builder()
                .claim(CATEGORY, ACCESS_TOKEN) // "category": "access"
                .claim(UUID, uuid)             // "uuid": 사용자 UUID
                .claim(ROLE, role)             // "role": 사용자 역할
                .claim(NAME, name)
                .claim(EMAIL, email)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + accessExpiredTime))
                .signWith(secretKey)
                .compact();
    }

    /**
     * RefreshToken 생성 메서드
     * @param uuid 사용자 식별자
     * @param role 사용자 권한
     * @return JWT 형식의 RefreshToken 문자열
     */
    public String generateRefreshToken(String uuid, String role, String name, String email) {
        return Jwts.builder()
                .claim(CATEGORY, REFRESH_TOKEN)
                .claim(UUID, uuid)
                .claim(ROLE, role)
                .claim(NAME, name)
                .claim(EMAIL, email)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + refreshExpiredTime))
                .signWith(secretKey)
                .compact();
    }

    /**
     * 토큰에서 category/uuid/role 정보를 Map 형태로 추출
     * @param token JWT 문자열
     * @return key-value Map (category, uuid, role)
     */
    public Map<String, String> getJWTInformation(String token) {
        Map<String, String> information = new HashMap<>();
        information.put(CATEGORY, getCategory(token));
        information.put(UUID, getUUID(token));
        information.put(ROLE, getRole(token));
        return information;
    }

    /**
     * 토큰에서 "category" 클레임 추출
     */
    public String getCategory(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("category", String.class);
    }

    /**
     * 토큰에서 "uuid" 클레임 추출
     */
    public String getUUID(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("uuid", String.class);
    }

    /**
     * 토큰에서 "role" 클레임 추출
     */
    public String getRole(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class);
    }

    /**
     * 토큰에서 "name" 클레임 추출
     */
    public String getName(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("name", String.class);
    }

    /**
     * 토큰에서 "email" 클레임 추출
     */
    public String getEmail(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("email", String.class);
    }

    /**
     * JWT가 만료되었는지 여부 반환
     * @param token JWT 문자열
     * @return true: 만료됨 / false: 유효함
     */
    public Boolean isExpired(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration()
                .before(new Date());
    }

    /**
     * Refresh 토큰의 만료 시간(ms)을 반환
     */
    public Long getRefreshExpiredTime() {
        return refreshExpiredTime;
    }
}
