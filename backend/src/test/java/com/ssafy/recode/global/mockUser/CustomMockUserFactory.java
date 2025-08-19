package com.ssafy.recode.global.mockUser;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.global.dto.CustomUserDetails;
import com.ssafy.recode.global.enums.Provider;
import java.time.LocalDate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

public class CustomMockUserFactory implements WithSecurityContextFactory<WithMockCustomUser> {

  @Override
  public SecurityContext createSecurityContext(WithMockCustomUser customUser) {
    SecurityContext context = SecurityContextHolder.createEmptyContext();

    User mockUser = User.fullBuilder()
        .email(customUser.email())
        .name(customUser.name())
        .password(customUser.password())
        .role(customUser.role())
        .phone(customUser.phone())
        .provider(Provider.LOCAL)
        .birthDate(LocalDate.now())
        .build();

    CustomUserDetails principal = new CustomUserDetails(mockUser);

    Authentication auth =
        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

    context.setAuthentication(auth);
    return context;
  }
}
