package com.ssafy.recode.domain.auth.repository;

import com.ssafy.recode.domain.auth.entity.RefreshToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

/**
 * RefreshTokenRepository
 *
 * 사용자 1인당 하나의 리프레시 토큰을 관리하며,
 * 토큰 저장, 조회, 삭제 등의 기능을 제공합니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * 특정 토큰 값이 존재하는지 확인
     *
     * @param token JWT 리프레시 토큰 문자열
     * @return true: 존재함, false: 없음
     */
    Boolean existsByTokenValue(String token);

    /**
     * 특정 사용자에 대한 리프레시 토큰이 존재하는지 확인
     *
     * @param userId 사용자 아이디
     * @return true: 존재함, false: 없음
     */
    Boolean existsByUserId(Long userId);

    /**
     * 토큰 문자열로 리프레시 토큰 엔티티 조회
     *
     * @param token JWT 리프레시 토큰
     * @return Optional<RefreshToken>
     */
    Optional<RefreshToken> findByTokenValue(String token);

    /**
     * 사용자 기준으로 리프레시 토큰 조회
     *
     * @param userId 사용자 아이디
     * @return Optional<RefreshToken>
     */
    Optional<RefreshToken> findRefreshTokenByUserId(Long userId);

    /**
     * 토큰 문자열로 삭제
     *
     * @param token 삭제할 토큰 문자열
     */
    @Transactional
    void deleteByTokenValue(String token);

    /**
     * 사용자 기준으로 토큰 삭제 (로그아웃 등)
     *
     * @param userId 사용자 아이디
     */
    @Transactional
    void deleteByUserId(Long userId);
}
