package com.ssafy.recode.domain.link.entity;

import lombok.*;

import java.io.Serializable;

/**
 * GuardianElder 엔티티의 복합키 ID 클래스
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class GuardianElderId implements Serializable {
  private Long guardianId;
  private Long elderId;
}
