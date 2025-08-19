package com.ssafy.recode.domain.auth.entity;

import com.ssafy.recode.global.enums.Provider;
import com.ssafy.recode.global.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * User 엔티티
 *
 * 일반 로그인 및 카카오 소셜 로그인을 지원하는 사용자 테이블 매핑 클래스.
 * 노인/보호자/관리자 역할을 구분하며, 각 사용자의 UUID, OAuth 정보 등을 포함함.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 기본 키 (PK)

    @Column(nullable = false, unique = true, length = 100)
    private String email; // 이메일 (로그인 ID, 중복 불가)

    @Column(nullable = false, length = 100)
    private String name; // 사용자 이름

    private LocalDate birthDate; // 생년월일

    @Column(unique = true, length = 20)
    private String phone; // 전화번호 (중복 불가)

    private String password; // 비밀번호 (BCrypt 등 해시 저장)

    private String profileImageUrl; // 프로필 이미지 URL (선택)

    @Column(nullable = false, unique = true, length = 36)
    private String uuid; // 고유 식별자 (API에서 식별용, 랜덤 UUID)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Provider provider; // 로그인 방식: KAKAO, LOCAL

    private String providerId; // 소셜 로그인 고유 ID (카카오 사용자 ID 등)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // 사용자 역할: ELDER(노인), GUARDIAN(보호자), ADMIN(관리자)

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt; // 생성일시

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt; // 수정일시

    /**
     * Builder를 사용한 생성자 (UUID는 @PrePersist에서 자동 생성)
     */
    @Builder(builderMethodName = "fullBuilder")
    public User(String email, String name, LocalDate birthDate, String phone,
                String password, String profileImageUrl, Provider provider,
                String providerId, Role role) {
        this.email = email;
        this.name = name;
        this.birthDate = birthDate;
        this.phone = phone;
        this.password = password;
        this.profileImageUrl = profileImageUrl;
        this.provider = provider;
        this.providerId = providerId;
        this.role = role;
    }

    @Builder(builderMethodName = "authBuilder", builderClassName = "AuthBuilder")
    public User(String uuid, Role role, String name, String email) {
        this.uuid = uuid;
        this.role = role;
        this.name = name;
        this.email = email;
    }

    /**
     * JPA persist 시 자동으로 UUID 생성
     */
    @PrePersist
    protected void onCreate() {
        if (this.uuid == null) {
            this.uuid = UUID.randomUUID().toString();
        }
    }
}
