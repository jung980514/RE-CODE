package com.ssafy.recode.domain.auth.service;

import com.ssafy.recode.domain.auth.entity.RefreshToken;
import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.repository.RefreshTokenRepository;
import com.ssafy.recode.domain.auth.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * RefreshTokenService
 *
 * 리프레시 토큰 저장/조회/갱신 관련 비즈니스 로직을 담당하는 서비스 클래스입니다.
 * 사용자 UUID나 토큰 문자열을 기반으로 토큰을 관리합니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    /**
     * 기존 토큰 엔터티를 새로운 값으로 갱신합니다.
     *
     * @param previousToken 이전 토큰 문자열
     * @param newToken 새로운 토큰 문자열
     * @param expiredMs 만료 시간 (밀리초)
     * @return 갱신된 RefreshToken 엔터티
     */
    @Transactional
    public RefreshToken renewalRefreshToken(String previousToken, String newToken, Long expiredMs) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenValue(previousToken)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 REFRESH_TOKEN 입니다."));

        LocalDateTime newExpireTime = LocalDateTime.now().plusSeconds(expiredMs / 1000);

        refreshToken.updateToken(newToken, newExpireTime.toString());

        return refreshToken;
    }

    /**
     * 새로운 리프레시 토큰 엔터티를 생성하여 저장합니다.
     *
     * @param refresh 새로 생성된 리프레시 토큰
     * @param uuid 사용자 UUID
     * @param expiredMs 만료 시간 (밀리초)
     * @return 저장된 RefreshToken 엔터티
     */
    @Transactional
    public RefreshToken addRefreshEntity(String refresh, String uuid, Long expiredMs) {
        User user = userRepository.findByUuid(uuid)
                .orElseThrow(() -> new EntityNotFoundException(uuid + "의 회원이 존재하지 않습니다."));

        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expiredMs / 1000);

        RefreshToken refreshToken = new RefreshToken(user, refresh, expiresAt.toString());

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * 사용자 ID를 기반으로 리프레시 토큰을 조회합니다.
     *
     * @param userId 사용자 PK
     * @return Optional<RefreshToken>
     */
    public Optional<RefreshToken> findRefreshToken(Long userId) {
        return refreshTokenRepository.findRefreshTokenByUserId(userId);
    }
}
