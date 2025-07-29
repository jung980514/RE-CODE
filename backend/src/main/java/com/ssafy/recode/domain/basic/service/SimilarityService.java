package com.ssafy.recode.domain.basic.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * SimilarityService는 GMS(Gemini) text-embedding-004 모델의
 * embedContent 엔드포인트를 사용해 각 텍스트를 벡터화하고
 * 코사인 유사도를 계산합니다.
 *
 * embedContent 응답에 "embeddings" 배열 혹은
 * 단일 "embedding" 오브젝트가 올 수 있으므로,
 * 둘 모두를 처리하도록 수정했습니다.
 */
@Service
@RequiredArgsConstructor
public class SimilarityService {

  @Value("${gms.api-key}")
  private String gmsApiKey;

  /** GMS 프록시 경유 + generativelanguage.googleapis.com 엔드포인트 */
  private final WebClient client = WebClient.builder()
      .baseUrl("https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models")
      .build();

  /**
   * 두 문장의 유사도를 0~1 사이로 계산합니다.
   */
  public double compare(String q1, String q2) throws Exception {
    System.out.println("📊 유사도 비교 시작: [" + q1 + "] vs [" + q2 + "]");
    List<List<Double>> vectors = new ArrayList<>();
    for (String text : List.of(q1, q2)) {
      vectors.add(embedText(text));
    }
    System.out.println("🔢 임베딩 벡터 2개 수집 완료");
    double score = cosine(vectors.get(0), vectors.get(1));
    System.out.println("✅ 코사인 유사도: " + score);
    return score;
  }

  /**
   * GMS embedContent 엔드포인트를 호출해 한 텍스트를 벡터로 변환합니다.
   * "embeddings" 배열 또는 단일 "embedding" 오브젝트 모두 처리합니다.
   */
  private List<Double> embedText(String text) throws Exception {
    // 1) 요청 바디 구성
    Map<String,Object> requestBody = Map.of(
        "model", "text-embedding-004",
        "content", Map.of("parts", List.of(Map.of("text", text)))
    );
    System.out.println("📝 embedContent 요청 바디: " + requestBody);

    // 2) API 호출 및 전체 응답 로그
    String response = client.post()
        .uri(uriBuilder -> uriBuilder
            .path("/text-embedding-004:embedContent")
            .queryParam("key", gmsApiKey)
            .build())
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(requestBody)
        .retrieve()
        .onStatus(status -> !status.is2xxSuccessful(), resp ->
            resp.bodyToMono(String.class).flatMap(body -> {
              System.out.println("❌ 임베딩 API 에러 코드: " + resp.statusCode());
              System.out.println("❌ 임베딩 API 에러 바디: " + body);
              return Mono.error(new RuntimeException("임베딩 API 호출 실패"));
            })
        )
        .bodyToMono(String.class)
        .block();

    // 3) 응답 파싱 (embeddings 배열 또는 단일 embedding 처리)
    JsonNode root = new ObjectMapper().readTree(response);
    List<Double> vector = new ArrayList<>();

    JsonNode embeddingsArray = root.path("embeddings");
    if (embeddingsArray.isArray() && embeddingsArray.size() > 0) {
      // 배열 형태일 때
      JsonNode values = embeddingsArray.get(0).path("values");
      if (!values.isArray()) {
        throw new RuntimeException("임베딩 values 배열이 아닙니다: " + response);
      }
      for (JsonNode v : values) {
        vector.add(v.asDouble());
      }
    } else {
      // 단일 오브젝트 형태일 때 ("embedding")
      JsonNode single = root.path("embedding").path("values");
      if (!single.isArray() || single.isEmpty()) {
        throw new RuntimeException("임베딩 결과가 없습니다: " + response);
      }
      for (JsonNode v : single) {
        vector.add(v.asDouble());
      }
    }

    System.out.println("🔍 파싱된 벡터 길이: " + vector.size());
    return vector;
  }

  /**
   * 두 벡터의 코사인 유사도를 계산합니다.
   */
  private double cosine(List<Double> a, List<Double> b) {
    System.out.println("🔄 코사인 계산 시작");
    double dot = 0, magA = 0, magB = 0;
    for (int i = 0; i < a.size(); i++) {
      dot += a.get(i) * b.get(i);
      magA += a.get(i) * a.get(i);
      magB += b.get(i) * b.get(i);
    }
    double result = dot / (Math.sqrt(magA) * Math.sqrt(magB));
    System.out.println("🔚 코사인 계산 완료: " + result);
    return result;
  }
}
