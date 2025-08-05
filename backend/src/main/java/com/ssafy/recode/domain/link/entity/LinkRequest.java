package com.ssafy.recode.domain.link.entity;

import com.ssafy.recode.global.enums.LinkStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(
    name = "link_requests",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"elderId", "guardianId"})
    }
)
public class LinkRequest {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // 노인 user.id
  @Column(nullable = false)
  private Long elderId;

  // 보호자 user.id
  @Column(nullable = false)
  private Long guardianId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private LinkStatus status; // PENDING, ACCEPTED, REJECTED

  @Column(nullable = false)
  private LocalDateTime requestedAt;

  @PrePersist
  protected void onCreate() {
    this.requestedAt = LocalDateTime.now();
  }

  public void approve() {
    this.status = LinkStatus.ACCEPTED;
  }

  public void reject() {
    this.status = LinkStatus.REJECTED;
  }
}