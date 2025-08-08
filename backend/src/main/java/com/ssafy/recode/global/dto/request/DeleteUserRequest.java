package com.ssafy.recode.global.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * DeleteUserRequest
 * 회원 탈퇴 요청 DTO
 * - LOCAL 계정: password 필수 (서버에서 검증)
 * - 소셜 계정(KAKAO 등): password 생략 가능
 *
 * @author 정지용
 * @since 2025. 8. 8.
 */
@Getter
@NoArgsConstructor
public class DeleteUserRequest {

    /** LOCAL 계정일 경우 필수로 검증됨(컨트롤러/서비스 레벨) */
    private String password;
}
