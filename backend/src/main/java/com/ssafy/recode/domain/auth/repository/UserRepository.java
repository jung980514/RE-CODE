package com.ssafy.recode.domain.auth.repository;

import com.ssafy.recode.domain.auth.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * UserRepository
 *
 * 사용자(User) 엔티티에 대한 데이터 접근을 담당하는 JPA 리포지토리입니다.
 * 이메일, UUID, 전화번호를 기준으로 사용자를 조회할 수 있는 메서드를 제공합니다.
 * Spring Data JPA의 메서드 네이밍 규칙에 따라 쿼리가 자동으로 생성됩니다.
 *
 * 예:
 * - findByEmail("test@example.com")
 * - findByUuid("a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6")
 * - findByPhone("010-1234-5678")
 *
 * @since 2025. 8. 08.
 */
public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * 이메일을 기반으로 사용자 조회
     *
     * @param email 사용자 이메일
     * @return 해당 이메일을 가진 사용자 Optional
     */
    Optional<User> findByEmail(String email);
    /**
     * UUID를 기반으로 사용자 조회
     *
     * @param uuid 사용자 고유 식별자
     * @return 해당 UUID를 가진 사용자 Optional
     */
    Optional<User> findByUuid(String uuid);
    /**
     * 전화번호를 기반으로 사용자 조회
     *
     * @param phone 사용자 전화번호
     * @return 해당 전화번호를 가진 사용자 Optional
     */
    Optional<User> findByPhone(String phone);
}
