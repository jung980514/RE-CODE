package com.ssafy.recode;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import io.github.cdimascio.dotenv.Dotenv;

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
      // .env 자동 로드
      Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

      // 환경 변수로 등록 (application.properties에서 인식되도록)
      System.setProperty("AWS_ACCESS_KEY", dotenv.get("AWS_ACCESS_KEY"));
      System.setProperty("AWS_SECRET_KEY", dotenv.get("AWS_SECRET_KEY"));
      SpringApplication.run(RecodeApplication.class, args);
  }
}
