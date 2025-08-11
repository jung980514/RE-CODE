package com.ssafy.recode.global.security.config;

import com.ssafy.recode.domain.auth.repository.RefreshTokenRepository;
import com.ssafy.recode.domain.auth.service.RefreshTokenService;
import com.ssafy.recode.global.oauth.OAuth2SuccessHandler;
import com.ssafy.recode.global.oauth.OAuth2UserServiceImpl;
import com.ssafy.recode.global.security.filter.JWTAccessFilter;
import com.ssafy.recode.global.security.filter.JWTLoginFilter;
import com.ssafy.recode.global.security.filter.JWTLogoutFilter;
import com.ssafy.recode.global.security.filter.JWTRefreshFilter;
import com.ssafy.recode.global.security.util.FilterResponseUtils;
import com.ssafy.recode.global.security.util.JWTUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * SecurityConfig
 * <p>
 * Spring Security 전체 설정 클래스입니다. JWT + OAuth2 기반 로그인 처리와 사용자 인증 필터를 등록합니다.
 *
 * @author 김영민
 * @since 2025. 7. 27.
 */
@EnableWebSecurity
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  private final OAuth2UserServiceImpl oAuth2UserService;

  private final OAuth2SuccessHandler oAuth2SuccessHandler;

  private final JWTUtils jwtUtil;

  private final RefreshTokenRepository refreshTokenRepository;

  private final FilterResponseUtils filterResponseUtils;

  /**
   * 비밀번호 암호화를 위한 BCrypt 빈 등록
   */
  @Bean
  public BCryptPasswordEncoder bCryptPasswordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /**
   * AuthenticationManager 빈 등록
   */
  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
      throws Exception {
    return config.getAuthenticationManager();
  }

  /**
   * Spring Security의 핵심 필터 체인 설정
   */
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http,
                                         AuthenticationManager authenticationManager,
                                         JWTUtils jwtUtil,
                                         CorsConfigurationSource corsConfigurationSource,
                                         RefreshTokenService refreshTokenService) throws Exception {

    JWTLoginFilter jwtLoginFilter = new JWTLoginFilter(authenticationManager, jwtUtil, refreshTokenService);

    // JWT 커스텀 필터 등록
//    http
//        .addFilterBefore(jwtLoginFilter, UsernamePasswordAuthenticationFilter.class)
//        .addFilterAfter(new JWTAccessFilter(jwtUtil, filterResponseUtils),
//            OAuth2LoginAuthenticationFilter.class)
//        .addFilterAfter(new JWTRefreshFilter(refreshTokenRepository, filterResponseUtils),
//            OAuth2LoginAuthenticationFilter.class)
//        .addFilterBefore(new JWTLogoutFilter(refreshTokenRepository, filterResponseUtils),
//            LogoutFilter.class);
//
//    // OAuth2 로그인 설정
//    http
//        .oauth2Login(oauth2 -> oauth2
//            .loginPage("/api/user/login/page") // 커스텀 로그인 페이지 URL
//            .userInfoEndpoint(endpoint -> endpoint.userService(oAuth2UserService)) // 사용자 정보 조회 서비스
//            .successHandler(oAuth2SuccessHandler) // 로그인 성공 시 핸들러
//        );

    // 인가 정책 설정
    http
            // CORS 설정 (Customizer 람다만 사용) :contentReference[oaicite:0]{index=0}
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            // CSRF 비활성화
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())

            // 커스텀 JWT 필터 등록
            .addFilterBefore(jwtLoginFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(new JWTAccessFilter(jwtUtil, filterResponseUtils),
                    OAuth2LoginAuthenticationFilter.class)
            .addFilterAfter(new JWTRefreshFilter(refreshTokenRepository, filterResponseUtils),
                    OAuth2LoginAuthenticationFilter.class)
            .addFilterBefore(new JWTLogoutFilter(refreshTokenRepository, filterResponseUtils),
                    LogoutFilter.class)

            // OAuth2 로그인 설정
            .oauth2Login(oauth2 -> oauth2
                    .loginPage("/api/user/login/page")
                    .userInfoEndpoint(endpoint -> endpoint.userService(oAuth2UserService))
                    .successHandler(oAuth2SuccessHandler)
            )

            // 인가 정책
            .authorizeHttpRequests(auth -> auth
                    // Swagger & Docs & favicon & error 페이지
                    .requestMatchers(
                            "/favicon.ico",
                            "/error",
                            "/v3/api-docs/**",
                            "/swagger-ui/**",
                            "/swagger-ui.html",
                            "/webjars/**",
                            "/actuator/**",
                            "/metrics/**"
                    ).permitAll()
                    // 인증 없이 열어둘 API
                    .requestMatchers(
                            "/api/user/login/page",
                            "/api/user/login",
                            "/api/user/register",
                            "/api/reissue",
                            "/login/oauth2/code/**",
                            "/index.html"
                    ).permitAll()
                    // Prometheus 모니터링 IP 제한
                    //.requestMatchers("/actuator/prometheus")
                    //.access(new WebExpressionAuthorizationManager("hasIpAddress('172.21.0.0/16')"))
                    // 나머지 요청은 인증 필요
                    .anyRequest().authenticated()
            );

    return http.build();
  }



  /**
   * WebSecurityCustomizer
   * <p>
   * Spring Security의 보안 필터 체인을 아예 타지 않도록 요청 경로를 지정하는 설정 클래스입니다. 해당 경로는 인증/인가 검사 자체를 하지 않으며, 필터를 완전히
   * 무시합니다.
   * <p>
   * - /favicon.ico : 브라우저가 자동으로 요청하는 파비콘 - /error : Spring Boot에서 기본 제공하는 에러 처리 경로 - /h2-console/**
   * : H2 데이터베이스 웹 콘솔 (개발용으로만 허용)
   *
   * @return WebSecurityCustomizer 빈
   */
  @Bean
  public WebSecurityCustomizer webSecurityCustomizer() {
    return web -> web.ignoring()
        // 브라우저가 자동 요청하는 파비콘: 보안 필터에서 제외
        .requestMatchers("/favicon.ico")

        // Spring Boot 기본 에러 페이지 요청: 인증처리 방지
        .requestMatchers("/error")
        .requestMatchers(
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/webjars/**")
        .requestMatchers("/actuator/**"); // 개발용으로 모두 허용;


    // H2 웹 콘솔은 개발 편의용으로 보안 필터에서 제외
//                .requestMatchers(toH2Console());
  }

}
