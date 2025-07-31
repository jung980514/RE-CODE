package com.ssafy.recode.domain.personal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * PersonalPromptEvaluationService는 회상 훈련용 개인화 질문과 답변을
 * LLM에 전달하여 0~100 사이의 점수로 “얼마나 잘 답변했는지” 평가한 뒤
 * 숫자(소수점)만 리턴합니다.
 */
@Service
@RequiredArgsConstructor
public class PersonalPromptEvaluationService {

  @Value("${gms.api-key}")
  private String apiKey;

  private final WebClient client = WebClient.builder()
      .baseUrl("https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models")
      .build();

  /**
   * 개인화된 질문(question)과 어르신의 답변(answer)을 받아,
   * 얼마나 잘 답했는지 0~100 사이 점수로 리턴합니다.
   */
  public double evaluateAnswer(String question, String answer) throws Exception {
    // 1) 오늘 날짜 문자열 생성
    String today = LocalDate.now()
        .format(DateTimeFormatter.ofPattern("yyyy년 M월 d일"));

    // 2) LLM에 보낼 프롬프트(지시문) 작성
    String prompt = """
      당신은 회상 훈련 평가 전문가입니다.
      오늘 날짜는 %s 입니다.
      아래 질문과 참여자의 답변을 보고,
      “이 답변이 질문에 얼마나 적절한지” 0에서 100 사이 정수로만 답해주세요.
      정답이 명확한(날짜·시간·수치) 질문은 오늘 날짜와 완벽히 일치할 때만 100점을 주고,
      조금이라도 어긋나면 0에 가깝게 평가하세요.

      질문: "%s"
      참여자 답변: "%s"
      """.formatted(today, question, answer);

    // 3) GMS API 요청 바디
    Map<String,Object> requestBody = Map.of(
      "contents", List.of(
        Map.of("parts", List.of(
          Map.of("text", prompt)
        ))
      )
    );

    // 4) API 호출
    String resp = client.post()
        .uri(uri -> uri
            .path("/gemini-2.0-flash:generateContent")
            .queryParam("key", apiKey)
            .build()
        )
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(requestBody)
        .retrieve()
        .onStatus(
            status -> !status.is2xxSuccessful(),
            r -> r.bodyToMono(String.class).flatMap(b -> Mono.error(new RuntimeException(b)))
        )
        .bodyToMono(String.class)
        .block();

    // 5) 응답 파싱
    JsonNode root = new ObjectMapper().readTree(resp);
    String text = root
        .path("candidates").get(0)
        .path("content").path("parts").get(0)
        .path("text").asText()
        .trim();

    // 6) “85” → 85.0 형태로 숫자만 추출
    try {
      return Double.parseDouble(text.replaceAll("[^0-9]", ""));
    } catch (NumberFormatException e) {
      throw new RuntimeException("평가 점수 파싱 실패: '" + text + "'", e);
    }
  }
}
