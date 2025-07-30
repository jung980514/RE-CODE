package com.ssafy.recode.global.security.config;

import com.ssafy.recode.global.security.resolver.CustomAuthenticationPrincipalArgumentResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web 관련 설정 클래스
 * - CORS 허용 설정
 * - 슬래시 경로 처리 설정
 *
 * @author 김영민
 * @since 2025-07-26
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer{

    private final CustomAuthenticationPrincipalArgumentResolver argumentResolver;

    /**
     * CORS 설정: 모든 도메인과 메서드 허용
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*") // 모든 Origin 허용
                .allowedMethods("GET","POST","PUT","DELETE") // 주요 HTTP 메서드 허용
                .allowedHeaders("*") // 모든 요청 헤더 허용
                .allowCredentials(false); // 자격 증명 포함 안 함

    }

    /**
     * URL 경로 슬래시 허용 여부 설정
     * - 예: /api/test 와 /api/test/ 둘 다 허용
     */
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.setUseTrailingSlashMatch(true);
    }

    /**
     * 커스텀 어노테이션 설정
     * @param resolvers
     */
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(argumentResolver);
    }
}
