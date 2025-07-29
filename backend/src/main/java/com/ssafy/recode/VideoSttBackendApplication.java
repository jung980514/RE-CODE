package com.ssafy.recode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class VideoSttBackendApplication {
  public static void main(String[] args) {
    SpringApplication.run(VideoSttBackendApplication.class, args);
  }
}
