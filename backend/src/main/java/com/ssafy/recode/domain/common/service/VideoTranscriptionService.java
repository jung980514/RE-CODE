package com.ssafy.recode.domain.common.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VideoTranscriptionService {

  private static final Logger log = LoggerFactory.getLogger(VideoTranscriptionService.class);

  private final S3Presigner s3Presigner;
  private final WebClient   clovaWebClient;
  private final ObjectMapper objectMapper;

  @Value("${cloud.aws.s3.bucket}")
  private String bucket;

  @Value("${clova.domain-code}")
  private String domainCode;

  @Value("${clova.domain-id}")
  private String domainId;

  @Value("${clova.secret-key}")
  private String clovaSecretKey;

  private static final Duration PRESIGN_DURATION = Duration.ofMinutes(15);

  /**
   * S3에 저장된 mediaKey의 비디오를 Clova로 전송해 텍스트를 동기적으로 반환합니다.
   */
  public String transcribeVideo(String mediaKey) {
    // Presigned URL 생성
    String presignedUrl = s3Presigner.presignGetObject(
        GetObjectPresignRequest.builder()
            .signatureDuration(PRESIGN_DURATION)
            .getObjectRequest(r -> r.bucket(bucket).key(mediaKey))
            .build()
    ).url().toString();

    // 동기 STT 요청 및 결과 리턴
    try {
      String payload = objectMapper.writeValueAsString(Map.of(
          "url", presignedUrl,
          "language", "ko-KR",
          "completion", "sync",
          "mediaFormat", "mp4",
          "ignorePunctuation", true
      ));

      String response = clovaWebClient.post()
          .uri("/external/v1/{domainCode}/{domainId}/recognizer/url", domainCode, domainId)
          .contentType(MediaType.APPLICATION_JSON)
          .header("X-CLOVASPEECH-API-KEY", clovaSecretKey)
          .bodyValue(payload)
          .retrieve()
          .bodyToMono(String.class)
          .block();

      log.info("◀◀◀ Clova 응답 = {}", objectMapper.readTree(response).path("text").asText());
      return objectMapper.readTree(response).path("text").asText();
    } catch (Exception e) {
      throw new RuntimeException("Clova STT 동기 요청 실패: " + e.getMessage(), e);
    }
  }
}
