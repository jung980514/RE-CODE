package com.ssafy.recode.global.security.resolver;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.repository.UserRepository;
import com.ssafy.recode.global.dto.CustomUserDetails;
import com.ssafy.recode.global.security.annotation.LoginUser;
import com.ssafy.recode.global.security.util.JWTUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
@AllArgsConstructor
@Slf4j
public class CustomAuthenticationPrincipalArgumentResolver implements HandlerMethodArgumentResolver {

    private final JWTUtils jwtUtils;

    private final UserRepository userRepository;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginUser.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (isAuthenticationUser(authentication)) {
            log.info("Authentication 객체가 없거나, 익명 사용자 입니다.");
            return null;
        }

        User user = getUserFromAuthentication(authentication);

        log.info("user name = {}", user.getName());

        return user;
    }

    private User getUserFromAuthentication(Authentication authentication) {
        // jwt token 추출
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

//        String token = (String) authentication.getPrincipal();

        String uuid = userDetails.getUUID();

        return userRepository.findByUuid(uuid).orElseThrow();
    }

    private boolean isAuthenticationUser(Authentication authentication) {
        return authentication == null || authentication instanceof AnonymousAuthenticationToken;
    }
}
