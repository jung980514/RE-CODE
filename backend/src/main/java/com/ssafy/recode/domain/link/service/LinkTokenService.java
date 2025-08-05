package com.ssafy.recode.domain.link.service;

import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * LinkTokenService
 * 보호자 연동을 위한 일회용 토큰을 생성하고 Redis에 저장/조회/삭제하는 서비스 클래스
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@Service
@RequiredArgsConstructor
public class LinkTokenService {

  private final StringRedisTemplate redisTemplate;

  // Redis 키 접두사
  private static final String PREFIX = "guardian:link_token:";
  // 토큰 유효 기간: 10분
  private static final Duration TTL = Duration.ofMinutes(10);

  /**
   * 노인 사용자가 보호자 연동을 위해 6자리 토큰을 생성하고 Redis에 elderId와 함께 저장한다.
   * @param elderId 현재 로그인한 노인의 user.id
   * @return 생성된 6자리 토큰 문자열
   */
  public String generateToken(Long elderId) {
    String token = UUID.randomUUID().toString().substring(0, 6); // 6자리 토큰 생성
    String key = PREFIX + token;

    // Redis에 저장
    redisTemplate.opsForValue().set(key, String.valueOf(elderId), TTL);

    return token;
  }

  /**
   * 보호자가 입력한 토큰을 Redis에서 조회하여 해당 노인의 ID를 반환한다.
   * @param token 보호자가 입력한 토큰 문자열
   * @return 연결된 elderId (없으면 null 반환)
   */
  public Long getElderIdFromToken(String token) {
    String key = PREFIX + token;
    String elderIdStr = redisTemplate.opsForValue().get(key);

    // 값이 null이 아니면 Long으로 변환 후 반환, 없으면 null
    return elderIdStr != null ? Long.parseLong(elderIdStr) : null;
  }

  /**
   * 사용된 토큰을 Redis에서 삭제한다 (수락/거절 또는 만료 후 수동 삭제)
   * @param token 삭제할 토큰 문자열
   */
  public void invalidateToken(String token) {
    redisTemplate.delete(PREFIX + token);
  }
}
