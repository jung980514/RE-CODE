// src/main/java/com/ssafy/recode/domain/common/service/CommonPromptEvaluationService.java
package com.ssafy.recode.domain.common.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class CommonAiPromptService implements AiPromptService {

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

    @Override
    public List<String> generateDailyQuestions() throws Exception {
        String prompt = """
            치매 예방을 위한 회상 치료용 퀴즈형 설문 질문을 100개 생성해 주세요.
            각 질문은 노년층(65세 이상)의 **개인적인 과거 경험**을 떠올릴 수 있도록 설계되어야 하며, **정확한 정답**이 존재해야 합니다.
                        
            ❗ 주의사항:
            - 역사적 사건, 유행, 시대적 문화 요소에 대한 질문은 제외합니다.
            - 질문은 개인의 생애에 기반한 사실(예: 결혼 연도, 다녔던 학교, 자녀 수 등)만 포함합니다.
            - 민감하거나 부정적인 주제(사망, 질병, 경제 문제 등)는 피해주세요.
                        
            조건:
            - 각 질문은 1문장
            - 명령형이 아닌 회상을 유도하는 말투로 작성
            - 질문 사이에 번호 없이 줄바꿈으로 구분
            - 예: “당신이 다녔던 초등학교의 이름은 무엇이었나요?”
                        
            정확한 정답이 있는 회상 질문 100개를 생성해 주세요.
            """;

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

        List<String> questions = Arrays.stream(text.split("\n\n"))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toList());

        try {
            return questions;
        } catch (NumberFormatException e) {
            throw new RuntimeException("점수 파싱 실패: '" + text + "'", e);
        }
    }
}
