package com.ssafy.recode.global.oauth;

import static com.ssafy.recode.global.constant.AuthConstant.KAKAO;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.repository.UserRepository;
import com.ssafy.recode.global.enums.Provider;
import com.ssafy.recode.global.enums.Role;
import com.ssafy.recode.global.oauth.oauthResponse.KakaoResponse;
import com.ssafy.recode.global.oauth.oauthResponse.OAuth2Response;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * OAuth2UserServiceImpl
 *
 * Spring Security의 OAuth2 인증 과정에서 사용자 정보를 불러와
 * 우리 서비스의 User 엔티티로 매핑 및 저장/조회하는 역할을 수행합니다.
 * 현재는 카카오(Kakao) 로그인만 지원하며, 신규 사용자는 자동 회원가입 처리됩니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2UserServiceImpl extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    /**
     * OAuth2 로그인 성공 후 호출되는 메서드
     * @param userRequest OAuth2 사용자 요청 정보
     * @return OAuth2UserImpl (스프링 시큐리티에 등록될 사용자 객체)
     * @throws OAuth2AuthenticationException 예외 발생 시 처리
     */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 기본 OAuth2User 정보 획득
        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.info("OAuth2 사용자 정보: {}", oAuth2User.getAttributes());

        // 어떤 소셜 서비스(KAKAO 등)로부터 요청이 왔는지 확인
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        OAuth2Response oAuth2Response;

        // 현재는 카카오만 처리
        if (registrationId.equals(KAKAO)) {
            oAuth2Response = new KakaoResponse(oAuth2User.getAttributes());
        } else {
            log.warn("지원하지 않는 소셜 로그인입니다: {}", registrationId);
            return null; // 또는 throw new CustomException(...);
        }

        // 소셜 서비스에서 제공하는 순수 이메일
        String rawEmail = oAuth2Response.getEmail();
        String providerId = oAuth2Response.getProviderId();

        // 1. 소셜 이메일이 아닌, 순수 이메일로 가입된 '일반 계정'이 있는지 확인
        Optional<User> regularUserOpt = userRepository.findByEmail(rawEmail);
        if (regularUserOpt.isPresent()) {
            // 1-1. 일반 계정이 있다면, 해당 계정에 소셜 정보(providerId)를 연동
            User regularUser = regularUserOpt.get();
            regularUser.setProviderId(providerId);
            regularUser.setName(oAuth2User.getName());
            userRepository.save(regularUser);
            return new OAuth2UserImpl(regularUser);
        }else {
            // 1-2. 일반 계정이 없다면, 소셜 정보로 신규 가입 처리

            // 우리 시스템에서 사용할 이메일 형식 (기존 방식 유지)
            String socialEmail = oAuth2Response.getProvider() + " " + rawEmail;

            // 혹시 모를 중복 가입 방지: socialEmail로도 한번 더 확인
            Optional<User> socialUserOpt = userRepository.findByEmail(socialEmail);
            if (socialUserOpt.isPresent()) {
                return new OAuth2UserImpl(socialUserOpt.get());
            }

            // 신규 유저 자동 가입 처리
            User newUser = User.fullBuilder()
                .email(socialEmail)
                .name(oAuth2Response.getName())
                .provider(Provider.KAKAO)
                .providerId(oAuth2Response.getProviderId())
                .role(Role.USER)
                .build();

            userRepository.save(newUser);

            return new OAuth2UserImpl(newUser);
        }
    }
}
