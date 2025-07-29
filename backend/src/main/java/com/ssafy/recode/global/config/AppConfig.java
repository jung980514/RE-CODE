package com.ssafy.recode.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AppConfig {

  @Value("${cloud.aws.region.static}")
  private String awsRegion;

  @Bean
  public S3Client s3Client() {
    return S3Client.builder()
        .region(Region.of(awsRegion))
        .credentialsProvider(
            StaticCredentialsProvider.create(
                AwsBasicCredentials.create(
                    "AKIAX2S64FBG3YQMVP6G",
                    "1OC6vnq058FbVYHKROvpFTnSzbwumJogzPYjC0O8"
                )
            )
        )
        .build();
  }

  @Bean
  public WebClient webClient() {
    return WebClient.builder()
        .build();
  }
}
