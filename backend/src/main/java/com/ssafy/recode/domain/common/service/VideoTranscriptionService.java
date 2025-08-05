// src/main/java/com/ssafy/recode/domain/common/service/VideoTranscriptionService.java
package com.ssafy.recode.domain.common.service;

import com.ssafy.recode.global.filter.WebClientLoggingFilters;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.handler.logging.LogLevel;
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
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

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
     * S3에 저장된 WAV 키를 받아, Clova STT API 로 전사 후 텍스트 리턴
     */
    public String transcribeFromS3(String wavKey) throws Exception {
        ResponseBytes<GetObjectResponse> s3Bytes = s3Client.getObjectAsBytes(
            GetObjectRequest.builder().bucket(bucket).key(wavKey).build()
        );
        byte[] wavBytes = s3Bytes.asByteArray();

        HttpClient httpClient = HttpClient.create()
            .wiretap("reactor.netty.http.client.HttpClient",
                     LogLevel.DEBUG,
                     AdvancedByteBufFormat.TEXTUAL);

        WebClient client = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .filter(WebClientLoggingFilters.logRequest())
            .filter(WebClientLoggingFilters.logResponse())
            .defaultHeader("X-NCP-APIGW-API-KEY-ID", clovaClientId)
            .defaultHeader("X-NCP-APIGW-API-KEY", clovaClientSecret)
            .build();

        String resp = client.post()
            .uri(clovaEndpoint)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
            .body(BodyInserters.fromValue(wavBytes))
            .retrieve()
            .bodyToMono(String.class)
            .block();

        JsonNode root = new ObjectMapper().readTree(resp);
        String text = root.path("text").asText(null);
        if (text == null || text.isBlank()) {
            throw new RuntimeException("STT 결과 없음: " + resp);
        }
        return text;
    }
}
