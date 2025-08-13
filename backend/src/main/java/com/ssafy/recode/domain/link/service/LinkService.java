package com.ssafy.recode.domain.link.service;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.repository.UserRepository;
import com.ssafy.recode.domain.link.entity.GuardianElder;
import com.ssafy.recode.domain.link.entity.LinkRequest;
import com.ssafy.recode.domain.link.repository.GuardianElderRepository;
import com.ssafy.recode.domain.link.repository.LinkRequestRepository;
import com.ssafy.recode.global.dto.request.link.LinkApprovalRequest;
import com.ssafy.recode.global.dto.response.link.ElderSummaryResponse;
import com.ssafy.recode.global.dto.response.link.GuardianSummaryResponse;
import com.ssafy.recode.global.dto.response.link.LinkRequestListResponse;
import com.ssafy.recode.global.enums.LinkStatus;
import com.ssafy.recode.global.error.CustomException;
import com.ssafy.recode.global.error.ErrorCode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LinkService {

  private final LinkTokenService linkTokenService;         // Redis 토큰 관리
  private final LinkRequestRepository linkRequestRepository;             // 연동 요청 테이블
  private final GuardianElderRepository guardianElderRepository; // 연동 확정 테이블
  private final UserRepository userRepository;

  /**
   * 보호자가 연동 토큰을 제출했을 때 호출되는 메서드
   * - 토큰이 유효하면 연동 요청 테이블에 '대기중' 상태로 저장
   * - 중복 요청은 방지됨
   */
  public void requestLink(String token, Long guardianId) {
    // Redis에서 토큰으로 elderId 조회
    Long elderId = linkTokenService.getElderIdFromToken(token);

    if (elderId == null) {
      throw new CustomException(ErrorCode.LINK_TOKEN_INVALID);
    }

    // 중복 요청 방지: 이미 같은 guardian-elder 조합의 요청 존재 시 에러
    if (linkRequestRepository.existsByElderIdAndGuardianId(elderId, guardianId)) {
      throw new CustomException(ErrorCode.LINK_ALREADY_REQUESTED);
    }

    // 연동 요청 저장 (상태: PENDING)
    LinkRequest request = LinkRequest.builder()
        .elderId(elderId)
        .guardianId(guardianId)
        .status(LinkStatus.PENDING)
        .build();

    linkRequestRepository.save(request);
  }

  /**
   * 노인이 수락 또는 거절을 선택했을 때 호출되는 메서드
   * - 수락 시: guardian_elder 테이블에 관계 저장
   * - 거절 시: 상태만 REJECTED 처리
   * - 둘 다 요청 상태는 업데이트 됨
   */
  public void respondToRequest(Long elderId, LinkApprovalRequest linkApprovalRequest) {
    // 요청 조회
    LinkRequest request = linkRequestRepository.findByElderIdAndGuardianId(elderId, linkApprovalRequest.guardianId())
        .orElseThrow(() -> new CustomException(ErrorCode.LINK_REQUEST_NOT_FOUND));

    // 이미 처리된 요청인지 확인
    if (request.getStatus() != LinkStatus.PENDING) {
      throw new CustomException(ErrorCode.LINK_ALREADY_RESPONDED);
    }

    if (linkApprovalRequest.approve()) {
      // ✅ 수락 처리
      request.approve();
      linkRequestRepository.save(request);

      // 연동 확정 테이블에 저장
      GuardianElder link = GuardianElder.builder()
          .elderId(elderId)
          .guardianId(linkApprovalRequest.guardianId())
          .build();
      guardianElderRepository.save(link);

    } else {
      // ❌ 거절 처리
      request.reject();
      linkRequestRepository.save(request);
    }

    // 토큰 무효화 (보안을 위해)
    linkTokenService.invalidateToken(linkApprovalRequest.token());
  }

  /**
   * 노인 기준으로 보호자 연동 요청 목록을 조회
   */
  public List<LinkRequestListResponse> getRequestsForElder(Long elderId) {
    // 1. elderId 기준으로 요청 전체 조회
    List<LinkRequest> requests = linkRequestRepository.findAllByElderId(elderId);

    // 2. guardian 정보 포함하여 DTO 매핑
    return requests.stream()
        .map(req -> {
          User guardian = userRepository.findById(req.getGuardianId())
              .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND_ERROR));

          return new LinkRequestListResponse(
              guardian.getId(),
              guardian.getName(),
              guardian.getEmail(),
              req.getStatus(),
              req.getRequestedAt()
          );
        })
        .toList();
  }

  /**
   * 연동 해제 로직: guardian_elder 테이블에서 삭제
   * @param guardianId   보호자 ID
   * @param targetUserId  상대방 ID
   */
  @Transactional
  public void unlinkUsers(Long guardianId, Long targetUserId) {
    // 복합 키 존재 확인
    boolean exists = guardianElderRepository.existsByGuardianIdAndElderId(guardianId, targetUserId);

    if (!exists) {
      throw new CustomException(ErrorCode.LINK_NOT_FOUND);
    }

    guardianElderRepository.deleteByGuardianIdAndElderId(guardianId, targetUserId);
    linkRequestRepository.deleteByGuardianIdAndElderId(guardianId, targetUserId);
  }

  /**
   * 연동된 노인 목록을 조회
   * @param guardianId
   * @return
   */
  public List<ElderSummaryResponse> getLinkedEldersForGuardian(Long guardianId) {
    return guardianElderRepository.findLinkedEldersByGuardianId(guardianId);
  }


  /**
   * 연동된 노인 목록을 조회
   * @param elderId
   * @return
   */
  public List<GuardianSummaryResponse> getLinkedGuardiansForElder(Long elderId) {
    return guardianElderRepository.findLinkedGuardiansByElderId(elderId);
  }

}
