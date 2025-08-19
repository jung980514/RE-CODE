package com.ssafy.recode.domain.link.controller;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.link.service.LinkService;
import com.ssafy.recode.domain.link.service.LinkTokenService;
import com.ssafy.recode.global.dto.request.link.LinkApprovalRequest;
import com.ssafy.recode.global.dto.request.link.LinkRequestDto;
import com.ssafy.recode.global.dto.request.link.LinkUnlinkRequest;
import com.ssafy.recode.global.dto.response.ApiResponse;
import com.ssafy.recode.global.dto.response.link.ElderSummaryResponse;
import com.ssafy.recode.global.dto.response.link.GuardianSummaryResponse;
import com.ssafy.recode.global.dto.response.link.LinkRequestListResponse;
import com.ssafy.recode.global.dto.response.link.LinkTokenResponse;
import com.ssafy.recode.global.enums.Role;
import com.ssafy.recode.global.error.CustomException;
import com.ssafy.recode.global.error.ErrorCode;
import com.ssafy.recode.global.security.annotation.LoginUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * LinkController
 * - 보호자 연동 기능과 관련된 API 컨트롤러
 * - 노인이 토큰을 생성하고, 보호자가 해당 토큰으로 연동 요청을 보냄
 *
 * @author 김영민
 * @since 2025. 8. 04.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/link")
public class LinkController {

  private final LinkTokenService linkTokenService;
  private final LinkService linkService;

  /**
   * [노인] 연동용 토큰 생성 API
   * - 노인만 사용 가능
   * - 6자리 랜덤 토큰을 생성하여 Redis에 elderId와 함께 10분간 저장
   *
   * @param currentUser 현재 로그인한 사용자 (@LoginUser 커스텀 어노테이션 사용)
   * @return 토큰 문자열과 만료 시간(초)
   */
  @PostMapping
  public ResponseEntity<?> generateToken(@LoginUser User currentUser) {
    // 권한 체크: 노인만 가능
    if (currentUser.getRole() != Role.ELDER) {
      throw new CustomException(ErrorCode.ROLE_ELDER_ONLY_ACCESS_ERROR);
    }

    // Redis에 토큰 저장 (elderId → token)
    String token = linkTokenService.generateToken(currentUser.getId());

    return ResponseEntity.ok(ApiResponse.successResponse(new LinkTokenResponse(token,600)));
  }

  /**
   * [보호자] 연동 요청 API
   * - 보호자가 노인이 생성한 1회용 토큰을 입력해 연동 요청을 보냄
   * - 서버는 해당 토큰을 Redis에서 조회 후 연동 요청 대기 상태로 저장
   *
   * @param dto       보호자가 입력한 토큰 (LinkRequestDto)
   * @param guardianUser 로그인한 보호자 정보
   * @return 성공 메시지
   */
  @PostMapping("/req")
  public ResponseEntity<?> requestLink(@RequestBody LinkRequestDto dto,
      @LoginUser User guardianUser) {

    // 권한 체크: 보호자만 가능
    if (guardianUser.getRole() != Role.GUARDIAN) {
      throw new CustomException(ErrorCode.ROLE_GUARDIAN_ONLY_ACCESS_ERROR);
    }

    // 연동 요청 로직 수행 (Redis 토큰 조회 → DB 저장)
    linkService.requestLink(dto.token(), guardianUser.getId());

    return ResponseEntity.ok(ApiResponse.successResponseWithMessage("연동 요청이 접수되었습니다.", null));
  }

  /**
   * [노인] 연동 요청 목록 조회 API
   * - 본인에게 들어온 보호자의 연동 요청들을 모두 조회
   */
  @GetMapping("/list")
  public ResponseEntity<?> getLinkRequestList(@LoginUser User elderUser) {

    // 권한 체크: 노인만 접근 가능
    if (elderUser.getRole() != Role.ELDER) {
      throw new CustomException(ErrorCode.ROLE_ELDER_ONLY_ACCESS_ERROR);
    }

    // 요청 목록 조회
    List<LinkRequestListResponse> result = linkService.getRequestsForElder(elderUser.getId());

    return ResponseEntity.ok(ApiResponse.successResponse(result));
  }

  /**
   * [노인] 연동 요청 수락/거절 응답 API
   * - 노인이 보호자의 연동 요청에 대해 수락 또는 거절할 수 있음
   * - 수락 시 guardian_elder 테이블에 연동 관계 저장
   * - 거절 시 요청 상태만 변경됨 (REJECTED)
   *
   * @param request     보호자의 ID와 수락 여부가 담긴 요청 DTO
   * @param elderUser   현재 로그인한 노인 사용자
   * @return            처리 결과 메시지를 담은 응답
   */
  @PostMapping("/res")
  public ResponseEntity<?> respondToLinkRequest(@RequestBody LinkApprovalRequest request,
      @LoginUser User elderUser) {

    // 🔐 1. 권한 검사: 노인만 연동 응답 가능
    if (elderUser.getRole() != Role.ELDER) {
      throw new CustomException(ErrorCode.ROLE_ELDER_ONLY_ACCESS_ERROR);
    }

    // 🔁 2. 연동 수락/거절 로직 처리 (서비스로 위임)
    linkService.respondToRequest(elderUser.getId(), request);

    // ✅ 3. 처리 완료 메시지 반환
    return ResponseEntity.ok(
        ApiResponse.successResponseWithMessage(
            request.approve() ? "연동을 수락했습니다." : "연동 요청을 거절했습니다.",
            null
        )
    );
  }

  /**
   * 연동 해제 API (보호자만 가능)
   * - 매핑 테이블에서 제거
   * - 기존 연동 요청 상태도 DELETED 처리 가능
   *
   * @param guardianUser
   * @param request
   * @return
   */
  @DeleteMapping("/unlink")
  public ResponseEntity<?> unlinkGuardianElder(@LoginUser User guardianUser,
      @RequestBody LinkUnlinkRequest request) {
    // ✅ 1. 로그인된 사용자의 역할이 보호자인지 확인
    if (guardianUser.getRole() != Role.GUARDIAN) {
      // 보호자가 아니라면 예외 발생
      throw new CustomException(ErrorCode.ROLE_GUARDIAN_ONLY_ACCESS_ERROR);
    }

    linkService.unlinkUsers(guardianUser.getId(), request.targetUserId());

    return ResponseEntity.ok(ApiResponse.successResponseWithMessage("연동이 해제되었습니다.", null));
  }

  /**
   * [보호자] 연동된 노인 목록을 조회하는 API
   * [GET] /api/link/guardian/list
   *
   * @param guardianUser
   * @return List<ElderSummaryResponse>
   */
  @GetMapping("/guardian/list")
  public ResponseEntity<?> getLinkedElders(@LoginUser User guardianUser) {

    // ✅ 1. 로그인된 사용자의 역할이 보호자인지 확인
    if (guardianUser.getRole() != Role.GUARDIAN) {
      // 보호자가 아니라면 예외 발생
      throw new CustomException(ErrorCode.ROLE_GUARDIAN_ONLY_ACCESS_ERROR);
    }

    // ✅ 2. 서비스 계층을 통해 보호자 ID에 해당하는 연동된 노인 목록 조회
    List<ElderSummaryResponse> elders = linkService.getLinkedEldersForGuardian(
        guardianUser.getId());

    // ✅ 3. 응답을 ApiResponse 형태로 감싸서 반환 (메시지 포함)
    return ResponseEntity.ok(
        ApiResponse.successResponseWithMessage("연동된 노인 목록 조회 성공", elders)
    );
  }

  /**
   * [노인] 연동된 보호자 목록을 조회하는 API
   * [GET] /api/link/elder/list
   *
   * @param elderUser
   * @return List<GuardianSummaryResponse>
   */
  @GetMapping("/elder/list")
  public ResponseEntity<?> getLinkedGuardians(@LoginUser User elderUser) {

    // ✅ 1. 로그인된 사용자의 역할이 노인인지 확인
    if (elderUser.getRole() != Role.ELDER) {
      // 노인이 아니라면 예외 발생
      throw new CustomException(ErrorCode.ROLE_ELDER_ONLY_ACCESS_ERROR);
    }

    // ✅ 2. 서비스 계층을 통해 보호자 ID에 해당하는 연동된 보호자 목록 조회
    List<GuardianSummaryResponse> guardians = linkService.getLinkedGuardiansForElder(
        elderUser.getId());

    // ✅ 3. 응답을 ApiResponse 형태로 감싸서 반환 (메시지 포함)
    return ResponseEntity.ok(
        ApiResponse.successResponseWithMessage("연동된 보호자 목록 조회 성공", guardians)
    );
  }

}
