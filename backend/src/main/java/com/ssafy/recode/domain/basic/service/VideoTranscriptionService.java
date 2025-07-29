package com.ssafy.recode.domain.basic.service;

import com.ssafy.recode.global.filter.WebClientLoggingFilters;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.transport.logging.AdvancedByteBufFormat;
import io.netty.handler.logging.LogLevel;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

@Service
@RequiredArgsConstructor
public class VideoTranscriptionService {

  private final S3Client s3Client;

  @Value("${cloud.aws.s3.bucket}")
  private String bucket;
  @Value("${clova.endpoint}")
  private String clovaEndpoint;
  @Value("${clova.api-key}")
  private String clovaClientId;
  @Value("${clova.secret-key}")
  private String clovaClientSecret;

  /**
   * S3에 저장된 WAV 파일(wavKey)을 메모리로 바로 읽어 Clova STT API에 전송,
   * 반환된 JSON의 "text" 필드를 추출하여 리턴합니다.
   *
   * @param wavKey S3에 업로드된 WAV 객체의 키(prefix 포함)
   * @return STT 인식 결과 텍스트
   */
  public String transcribeFromS3(String wavKey) throws Exception {
    // 1) S3에서 WAV를 byte[]로 바로 읽기
    ResponseBytes<GetObjectResponse> s3Bytes = s3Client.getObjectAsBytes(
        GetObjectRequest.builder()
            .bucket(bucket)
            .key(wavKey)
            .build()
    );
    byte[] wavBytes = s3Bytes.asByteArray();
    System.out.println("✅ S3에서 메모리로 바로 읽음, 크기=" + wavBytes.length);

    // 2) WebClient 설정
    HttpClient httpClient = HttpClient.create()
        .wiretap("reactor.netty.http.client.HttpClient", LogLevel.DEBUG, AdvancedByteBufFormat.TEXTUAL);
    WebClient client = WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .filter(WebClientLoggingFilters.logRequest())
        .filter(WebClientLoggingFilters.logResponse())
        .defaultHeader("X-NCP-APIGW-API-KEY-ID", clovaClientId)
        .defaultHeader("X-NCP-APIGW-API-KEY", clovaClientSecret)
        .build();

    // 3) Clova STT API 호출
    System.out.println("🔁 Clova STT 호출(in-memory) 시작");
    String resp = client.post()
        .uri(clovaEndpoint)
        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
        .body(BodyInserters.fromValue(wavBytes))
        .retrieve()
        .bodyToMono(String.class)
        .block();
    System.out.println("📥 Clova 응답: " + resp);

    // 4) JSON 파싱 및 "text" 추출
    JsonNode root = new ObjectMapper().readTree(resp);
    String text = root.path("text").asText(null);
    if (text == null || text.isBlank()) {
      throw new RuntimeException("STT 변환 결과 없음: " + resp);
    }
    System.out.println("📝 인식 결과: " + text);
    return text;
  }
}
