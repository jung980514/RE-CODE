package com.ssafy.recode.global.dto.request;

import com.ssafy.recode.global.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Getter;

/**
 * SignupRequest
 * 일반 회원가입 요청 DTO
 * 노인(ELDER)과 보호자(GUARDIAN) 역할 분기를 포함
 *
 * @author 김영민
 * @since 2025. 7. 28.
 */
@Getter
public class RegisterRequest {

    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "이메일 형식이 유효하지 않습니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;

    @NotBlank(message = "전화번호는 필수입니다.")
    private String phone;

    @NotNull(message = "생년월일은 필수입니다.")
    private LocalDate birthDate;

    @NotNull(message = "회원 역할은 필수입니다.")
    private Role role; // ELDER 또는 GUARDIAN
}
