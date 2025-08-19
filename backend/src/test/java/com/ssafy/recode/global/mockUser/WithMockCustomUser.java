package com.ssafy.recode.global.mockUser;


import com.ssafy.recode.global.enums.Role;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.security.test.context.support.WithSecurityContext;

@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = CustomMockUserFactory.class)
public @interface WithMockCustomUser {
  String email() default "test@example.com";
  String name() default "테스트사용자";
  String password() default "password";
  Role role() default Role.ELDER;
  String phone() default "010-1234-5678";

}
