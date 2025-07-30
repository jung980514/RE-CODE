package com.ssafy.recode.domain.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * RefreshToken 엔티티
 *
 * 사용자(User)와 1:1로 매핑되며, 해당 사용자의 리프레시 토큰과 만료 정보를 저장합니다.
 * 토큰 재발급 시 값을 갱신합니다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 기본키 (PK)

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true) // UNIQUE: 사용자당 하나의 토큰만 존재
    private User user; // 사용자 (1:1 관계)

    @Column(nullable = false)
    private String tokenValue; // 리프레시 토큰 값 (JWT 문자열)

    @Column(nullable = false)
    private String expiresAt; // 만료 시각

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt; // 생성 시각

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt; // 마지막 수정 시각

    /**
     * RefreshToken 생성자
     *
     * @param user        연관 사용자
     * @param tokenValue  토큰 문자열
     * @param expiresAt   만료 시각
     */
    @Builder
    public RefreshToken(User user, String tokenValue, String expiresAt) {
        this.user = user;
        this.tokenValue = tokenValue;
        this.expiresAt = expiresAt;
    }

    /**
     * 토큰 값 및 만료 시각 갱신 메서드
     *
     * @param newTokenValue 새 리프레시 토큰 값
     * @param newExpiresAt  새 만료 시각
     */
    public void updateToken(String newTokenValue, String newExpiresAt) {
        this.tokenValue = newTokenValue;
        this.expiresAt = newExpiresAt;
    }

    /**
     * INSERT 직전에 호출됩니다.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * UPDATE 직전에 호출됩니다.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }


}