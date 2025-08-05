package com.ssafy.recode.domain.link.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 보호자와 노인의 실제 연동 정보를 저장하는 매핑 테이블
 * 연동이 수락(ACCEPTED)된 경우에만 여기에 저장됨
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "guardian_elder")
@IdClass(GuardianElderId.class)  // 복합 키 사용을 위한 ID 클래스 명시
public class GuardianElder {

  @Id
  private Long guardianId;  // 보호자 user.id

  @Id
  private Long elderId;     // 노인 user.id

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  public void prePersist() {
    this.createdAt = java.time.LocalDateTime.now();
  }
}
