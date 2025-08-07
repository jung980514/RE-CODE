package com.ssafy.recode;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@OpenAPIDefinition(
    info=@Info(
        title="Re:code API",
        version="v1.0",
        description="치매 예방 웹플랫폼 Re:code의 회상훈련 관련 API 문서",
        contact=@Contact(name="팀 고정삼김", email="jung980514@naver.com")
    ),
    servers={@Server(url="http://localhost:8088"),
              @Server(url="https://recode-my-life.site")}
)
@EnableAsync
@EnableScheduling
public class RecodeApplication {
  public static void main(String[] args) {
      SpringApplication.run(RecodeApplication.class, args);
  }
}
