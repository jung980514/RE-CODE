package com.ssafy.recode.global.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * LoginRequest
 * 일반 로그인 시 요청 데이터를 담는 DTO 클래스입니다.
 */
@Getter
@NoArgsConstructor
public class LoginRequest {

    @Email(message = "유효한 이메일 형식이 아닙니다.")
    @NotBlank(message = "이메일은 필수입니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;
}
