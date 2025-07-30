package com.ssafy.recode.global.oauth;

import com.ssafy.recode.domain.auth.entity.User;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * OAuth2UserImpl
 *
 * OAuth2 인증 이후 반환되는 사용자 정보를 기반으로 SecurityContext에 등록되는 사용자 객체입니다.
 * 내부적으로 프로젝트 도메인 User 엔티티를 보유하고 있으며,
 * 스프링 시큐리티가 요구하는 OAuth2User 인터페이스를 구현합니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@AllArgsConstructor
@Getter
public class OAuth2UserImpl implements OAuth2User {

    // 실제 DB에 저장된 사용자 객체
    private final User user;

    /**
     * OAuth2User 인터페이스에서 필수 구현 메서드.
     * - 사용자 속성을 반환해야 하지만, 현재는 사용하지 않으므로 null 처리.
     * - 필요 시 Map<String, Object> 형태의 OAuth 응답 정보를 담을 수 있음.
     */
    @Override
    public Map<String, Object> getAttributes() {
        return null;
    }

    /**
     * 사용자 권한 목록을 반환합니다.
     * - 현재는 하나의 권한(Role)만 사용하며, 이를 문자열로 반환합니다.
     * - 예: "ROLE_ELDER", "ROLE_GUARDIAN"
     *
     * @return 권한 목록
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> collection = new ArrayList<>();

        collection.add(new GrantedAuthority() {
            @Override
            public String getAuthority() {
                return user.getRole().toString(); // 예: "ELDER"
            }
        });

        return collection;
    }

    /**
     * 사용자 이름 반환
     * - 여기서는 User 엔티티의 name 필드 값 반환
     */
    @Override
    public String getName() {
        return user.getName();
    }

    /**
     * 인증 이후 SecurityContext에서 UUID를 사용해야 하는 경우를 위한 유틸 메서드
     * @return 유저 UUID
     */
    public String getUUID() {
        return user.getUuid();
    }
}
