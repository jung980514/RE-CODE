package com.ssafy.recode.global.config;

import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Actuator & Prometheus 엔드포인트 전용 보안 설정
 * 프로메테우스 서버에서 메트릭을 수집할 수 있도록 별도 보안 정책 적용
 */
@Configuration
@EnableWebSecurity
public class ActuatorSecurityConfig {

    /**
     * Actuator 엔드포인트 전용 보안 필터 체인
     * 프로메테우스 서버 접근을 위한 별도 보안 정책
     */
    @Bean
    @Order(1)
    public SecurityFilterChain actuatorSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(EndpointRequest.toAnyEndpoint())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(EndpointRequest.to("health", "info", "metrics", "prometheus")).permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf.disable())
            .httpBasic(basic -> basic.disable());
        
        return http.build();
    }
} 