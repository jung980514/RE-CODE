package com.ssafy.recode.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class AppConfig {

  @Value("${cloud.aws.region}")
  private String awsRegion;

  @Value("${cloud.aws.credentials.access-key}")
  private String awsAccessKey;

  @Value("${cloud.aws.credentials.secret-key}")
  private String awsSecretKey;

  @Value("${clova.invoke-url-base}")
  private String invokeUrlBase;

  /** Clova Speech 서비스용 Secret Key */
  @Value("${clova.secret-key}")
  private String clovaSecretKey;

  @Bean
  public AwsCredentialsProvider awsCredentialsProvider() {
    return StaticCredentialsProvider.create(
        AwsBasicCredentials.create(awsAccessKey, awsSecretKey)
    );
  }

  @Bean
  public Region awsRegion() {
    return Region.of(awsRegion);
  }

  @Bean
  public S3Client s3Client(AwsCredentialsProvider creds, Region region) {
    return S3Client.builder()
        .credentialsProvider(creds)
        .region(region)
        .build();
  }

  @Bean
  public S3Presigner s3Presigner(AwsCredentialsProvider creds, Region region) {
    return S3Presigner.builder()
        .credentialsProvider(creds)
        .region(region)
        .build();
  }
  /**
   * Clova Speech 호출용 WebClient 설정
   */
  @Bean
  public WebClient clovaWebClient() {
    return WebClient.builder()
        .baseUrl(invokeUrlBase)
        // Clova Speech는 Secret Key 하나로 인증
        .defaultHeader("X-CLOVASPEECH-API-KEY", clovaSecretKey)
        .build();
  }
}
