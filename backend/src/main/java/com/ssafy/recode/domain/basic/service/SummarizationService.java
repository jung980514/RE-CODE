package com.ssafy.recode.domain.basic.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * SummarizationService는 GMS(Gemini) API를 사용하여
 * 긴 텍스트(전체 STT 결과)를 3~5문장으로 요약합니다.
 * 에러 핸들링과 안전한 파싱을 포함합니다.
 */
@Service
@RequiredArgsConstructor
public class SummarizationService {

  /** application.properties에 설정된 GMS(Gemini) API 키 */
  @Value("${gms.api-key}")
  private String gmsApiKey;

  /** GMS 프록시 경유 + generativelanguage.googleapis.com 엔드포인트 */
  private final WebClient client = WebClient.builder()
      .baseUrl("https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models")
      .build();

  /**
   * 긴 텍스트를 3~5문장으로 간결하게 요약합니다.
   *
   * @param text 전체 STT 결과 텍스트
   * @return 3~5문장 요약문
   * @throws Exception 호출 실패·파싱 오류 시 발생
   */
  public String summarize(String text) throws Exception {
    // 1) 프롬프트 생성
    String prompt = """
      당신은 요약 전문가입니다.
      다음 글을 3~5문장으로 간결하게 요약해 주세요. 불필요한 인사나 잡담은 제외하고,
      핵심 내용 위주로 정리해 주세요:

      "%s"
      """.formatted(text);
    System.out.println("📝 요약 프롬프트: " + prompt);

    // 2) 요청 바디 구성
    Map<String,Object> requestBody = Map.of(
        "contents", List.of(
            Map.of("parts", List.of(
                Map.of("text", prompt)
            ))
        )
    );
    System.out.println("📤 요약 요청 바디: " + requestBody);

    // 3) API 호출 및 에러 핸들링
    String response = client.post()
        .uri(uriBuilder -> uriBuilder
            .path("/gemini-2.0-flash:generateContent")
            .queryParam("key", gmsApiKey)
            .build())
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(requestBody)
        .retrieve()
        .onStatus(status -> !status.is2xxSuccessful(), resp ->
            resp.bodyToMono(String.class).flatMap(body -> {
              System.out.println("❌ 요약 API 에러 코드: " + resp.statusCode());
              System.out.println("❌ 요약 API 에러 바디: " + body);
              return Mono.error(new RuntimeException("요약 API 호출 실패: " + resp.statusCode()));
            })
        )
        .bodyToMono(String.class)
        .block();
    System.out.println("📥 요약 API 전체 응답: " + response);

    // 4) 안전한 파싱
    JsonNode root = new ObjectMapper().readTree(response);
    JsonNode candidates = root.path("candidates");
    if (!candidates.isArray() || candidates.isEmpty()) {
      throw new RuntimeException("요약 API에 candidates 배열이 없습니다: " + response);
    }
    JsonNode textNode = candidates.get(0)
        .path("content")
        .path("parts")
        .path(0)
        .path("text");
    if (textNode.isMissingNode() || textNode.asText().isBlank()) {
      throw new RuntimeException("요약문을 찾을 수 없습니다: " + response);
    }

    String summary = textNode.asText();
    System.out.println("🔍 파싱된 요약문: " + summary);
    return summary;
  }
}
