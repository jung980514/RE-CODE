package com.ssafy.recode.global.dto.request;

import com.ssafy.recode.global.enums.Role;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * UpdateUserRequest
 * 회원 정보 수정 요청 DTO (부분 업데이트)
 * - 필요한 필드만 포함하여 부분 수정 허용
 * - 비밀번호 변경 시 currentPassword 검증 후 newPassword 반영
 *
 * @author 정지용
 * @since 2025. 8. 8.
 */
@Getter
@NoArgsConstructor
public class UpdateUserRequest {

    /** 사용자 이름 (선택) */
    @Size(min = 1, max = 100, message = "이름은 1~100자여야 합니다.")
    private String name;

    /** 전화번호 (선택, 형식 예: 숫자/대시 허용) */
    @Pattern(regexp = "^[0-9\\-]{9,20}$", message = "전화번호 형식이 유효하지 않습니다.")
    private String phone;

    /** 생년월일 (선택) */
    private LocalDate birthDate;

    /** 프로필 이미지 URL (선택) */
    @Size(max = 255, message = "프로필 이미지 URL은 255자를 초과할 수 없습니다.")
    private String profileImageUrl;

    /** 현재 비밀번호 (선택: LOCAL 계정에서 비밀번호 변경 시 필수) */
    private String currentPassword;

    /** 새 비밀번호 (선택: LOCAL 계정에서 비밀번호 변경 시 사용) */
    @Size(min = 8, max = 100, message = "새 비밀번호는 8~100자여야 합니다.")
    private String newPassword;

    private Role role;
}
