package com.ssafy.recode.global.config;
import org.apache.coyote.http11.AbstractHttp11Protocol;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatPostSizeConfig {

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            // 비멀티파트 JSON 등 전체 POST 바디 한도
            connector.setMaxPostSize(-1); // 무제한(필요 시 바이트 값으로 지정)

            // 프로토콜 핸들러로 캐스팅해서 swallow/save 한도 설정
            var handler = connector.getProtocolHandler();
            if (handler instanceof AbstractHttp11Protocol<?> protocol) {
                protocol.setMaxSwallowSize(-1);   // 무제한
                protocol.setMaxSavePostSize(-1);  // FORM/CLIENT-CERT 인증 시 버퍼 한도
            }
        });
    }
}