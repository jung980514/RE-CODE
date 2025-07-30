package com.ssafy.recode.domain.auth.service;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.repository.UserRepository;
import com.ssafy.recode.global.constant.AuthConstant;
import com.ssafy.recode.global.dto.Provider;
import com.ssafy.recode.global.dto.request.RegisterRequest;
import com.ssafy.recode.global.error.CustomException;
import com.ssafy.recode.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AuthService
 * 일반 회원가입 기능 (역할 기반)
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void register(RegisterRequest request) {
        String email = request.getEmail();
        // 이메일 중복 검사
        if (userRepository.findByEmail(email).isPresent()) {
            throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
        }

        // 소셜 계정 중복 검사 (카카오)
        String kakaoEmail = AuthConstant.KAKAO + " " + email;
        if(userRepository.findByEmail(kakaoEmail).isPresent()){
            throw new CustomException(ErrorCode.DUPLICATE_KAKAO_EMAIL);
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 유저 엔티티 생성
        User user = User.fullBuilder()
                .name(request.getName())
                .email(email)
                .password(encodedPassword)
                .phone(request.getPhone())
                .birthDate(request.getBirthDate())
                .role(request.getRole())
                .provider(Provider.LOCAL)
                .providerId(request.getEmail())
                .build();

        userRepository.save(user);

        // 역할 분기 후 추가 작업은 필요 시 이후 처리 가능
    }

}
