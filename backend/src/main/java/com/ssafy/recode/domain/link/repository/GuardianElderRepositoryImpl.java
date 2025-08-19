package com.ssafy.recode.domain.link.repository;

import static com.ssafy.recode.domain.auth.entity.QUser.user;
import static com.ssafy.recode.domain.link.entity.QGuardianElder.guardianElder;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.recode.global.dto.response.link.ElderSummaryResponse;
import com.ssafy.recode.global.dto.response.link.GuardianSummaryResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;

/**
 * GuardianElderRepositoryImpl
 * - QueryDSL을 사용하여 보호자와 연동된 노인 목록을 조회하는 커스텀 리포지토리 구현 클래스
 */
@RequiredArgsConstructor
public class GuardianElderRepositoryImpl implements GuardianElderCustomRepository {

  // ✅ QueryDSL 쿼리 생성을 위한 팩토리
  private final JPAQueryFactory queryFactory;


  /**
   * 보호자 ID를 기준으로 연동된 노인 목록을 조회하는 메서드
   * - user 테이블과 guardian_elder 테이블을 JOIN하여 노인 정보 반환
   * - 반환 타입은 ElderSummaryResponse DTO 리스트
   */
  @Override
  public List<ElderSummaryResponse> findLinkedEldersByGuardianId(Long guardianId) {
    return queryFactory
        .select(Projections.constructor(
            ElderSummaryResponse.class,    // ✅ 반환 DTO 타입 지정
            user.id,                       // 노인 ID
            user.name,                     // 노인 이름
            user.birthDate,                // 생년월일
            user.phone,                    // 전화번호
            guardianElder.createdAt        // 연동된 시점 (guardian_elder 테이블의 createdAt 컬럼)
        ))
        .from(guardianElder)                     // ✅ 연동 테이블 기준으로 시작
        .join(user).on(guardianElder.elderId.eq(user.id)) // 노인 ID로 user 테이블 조인
        .where(guardianElder.guardianId.eq(guardianId))   // 해당 보호자 ID 조건 필터
        .fetch(); // 결과 리스트 반환
  }

  /**
   * 노인 ID를 기준으로 연동된 보호자 목록을 조회하는 메서드
   * - user 테이블과 guardian_elder 테이블을 JOIN하여 보호자 정보 반환
   * - 반환 타입은 GuardianSummaryResponse DTO 리스트
   */
  @Override
  public List<GuardianSummaryResponse> findLinkedGuardiansByElderId(Long elderId) {
    return queryFactory
        .select(Projections.constructor(
            GuardianSummaryResponse.class,    // ✅ 반환 DTO 타입 지정
            user.id,                       // 보호자 ID
            user.name,                     // 보호자 이름
            user.phone,                    // 전화번호
            guardianElder.createdAt        // 연동된 시점 (guardian_elder 테이블의 createdAt 컬럼)
        ))
        .from(guardianElder)                     // ✅ 연동 테이블 기준으로 시작
        .join(user).on(guardianElder.guardianId.eq(user.id)) // 노인 ID로 user 테이블 조인
        .where(guardianElder.elderId.eq(elderId))   // 해당 보호자 ID 조건 필터
        .fetch(); // 결과 리스트 반환
  }
}
