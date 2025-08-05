// src/main/java/com/ssafy/recode/domain/common/service/CommonPromptEvaluationService.java
package com.ssafy.recode.domain.common.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class CommonPromptEvaluationService implements PromptEvaluationService {

    @Value("${gms.api-key}")
    private String apiKey;

    private final WebClient client = WebClient.builder()
        .baseUrl("https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models")
        .build();

    @Override
    public double evaluateAnswer(String question, String answer) throws Exception {
        String today = LocalDate.now()
            .format(DateTimeFormatter.ofPattern("yyyy년 M월 d일"));
        String prompt = """
            당신은 채점 전문가입니다.
            오늘 날짜는 %s 입니다.
            “이 답변이 질문에 얼마나 적절한지” 0에서 100 사이 정수로만 답해주세요.

            질문: "%s"
            학생 답변: "%s"
            """.formatted(today, question, answer);

        Map<String,Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            )
        );

        String resp = client.post()
            .uri(uri -> uri
                .path("/gemini-2.0-flash:generateContent")
                .queryParam("key", apiKey)
                .build()
            )
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body)
            .retrieve()
            .onStatus(s -> !s.is2xxSuccessful(),
                      r -> r.bodyToMono(String.class)
                            .flatMap(b -> Mono.error(new RuntimeException(b))))
            .bodyToMono(String.class)
            .block();

        JsonNode root = new ObjectMapper().readTree(resp);
        String text = root.path("candidates").get(0)
            .path("content").path("parts").get(0)
            .path("text").asText().trim();

        try {
            return Double.parseDouble(text.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            throw new RuntimeException("점수 파싱 실패: '" + text + "'", e);
        }
    }
}
