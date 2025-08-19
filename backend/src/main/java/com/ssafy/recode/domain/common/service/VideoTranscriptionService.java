package com.ssafy.recode.domain.common.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

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

  // Presigned URL 생성 (GET 전용)
  public String presign(String key, String contentType, int time) {
    GetObjectRequest get = GetObjectRequest.builder()
        .bucket(bucket)
        .key(key)
        // 콘텐츠 타입을 설정해주면 브라우저가 더 잘 인식합니다.
        .responseContentType(contentType)
        .build();

    PresignedGetObjectRequest pre = s3Presigner.presignGetObject(b -> b
        .signatureDuration(Duration.ofMinutes(time)) // 만료 시간
        .getObjectRequest(get)
    );

    return pre.url().toString();
  }

  /**
   * URL 또는 키 문자열을 안전하게 "S3 키"로 변환
   * - 풀 URL: https://bucket.s3.region.amazonaws.com/<encoded path>
   *          → host 제거 + URL 디코딩 → "폴더1/폴더2/파일명.mp4"
   * - 이미 키인 경우: 그대로 반환
   */
  public String toS3Key(String urlOrKey) {
    if (urlOrKey == null) return null;

    String lower = urlOrKey.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://")) {
      try {
        URI uri = URI.create(urlOrKey);
        String path = uri.getPath();     // "/folder1/folder2/file.mp4"
        if (path.startsWith("/")) path = path.substring(1);
        // 퍼센트 인코딩 해제 (예: %2C → ,)
        return URLDecoder.decode(path, StandardCharsets.UTF_8);
      } catch (Exception e) {
        // 파싱 실패 시, 최대한 호스트만 제거
        return urlOrKey.replaceFirst("^https?://[^/]+/", "");
      }
    }
    // 이미 키 형태
    return urlOrKey;
  }
}
