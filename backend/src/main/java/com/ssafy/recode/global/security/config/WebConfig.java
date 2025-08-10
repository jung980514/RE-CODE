package com.ssafy.recode.global.security.config;

import com.ssafy.recode.global.security.resolver.CustomAuthenticationPrincipalArgumentResolver;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
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

    // Filter 수준에서 동작하기 위한 CorsConfigurationSource를 구성하고 적용하자.
    // WebMvcConfigurer는 cors 설정은 무의미
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://localhost:3030",
                "http://localhost:8088",
                "https://recode-my-life.site",
                "https://www.recode-my-life.site",
                "http://i13e105.p.ssafy.io/",
                "https://i13e105.p.ssafy.io/"
        ));
//        configuration.setAllowedOrigins(Arrays.asList("*")); //로컬 테스트 https://recode-my-life.site", "http://localhost:3000
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false); // 🔥 true/false

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }
}
