// src/main/java/com/ssafy/recode/domain/common/service/CommonPromptEvaluationService.java
package com.ssafy.recode.domain.common.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.personal.entity.PersonalQuestion;
import com.ssafy.recode.domain.survey.service.SurveyService;
import com.ssafy.recode.global.dto.response.survey.SurveyQAResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommonAiPromptService implements AiPromptService {

    private final SurveyService surveyService;
    private final GenericPersistenceService genericPersistenceService;

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
            조건:
            - 점수는 0에서 100 사이 정수로만 답해주세요.

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
            - 답변을 단답식으로 받을 수 있게 질문을 생성
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

        return questions;
    }

    @Override
    public void generatePersonalQuestions(User user) throws Exception {
        StringBuilder promptBuilder = new StringBuilder("""
            당신은 노년층의 회상 치료를 돕는 전문가입니다.
            아래는 한 사용자가 오늘 회상 설문에서 답변한 질문과 응답입니다.
            이 응답을 바탕으로, 해당 사용자의 삶의 경험에 맞춘 **개인화 회상 질문 3개**를 생성해주세요.
        
            조건:
            - 각 질문은 반드시 1문장으로 구성해주세요.
            - 명령형이 아닌, 부드럽고 회상을 유도하는 말투로 작성해주세요.
            - 각 질문에는 "정답"이 존재해야 합니다. (ex. 특정한 이름, 연도, 장소 등)
            - 민감하거나 부정적인 주제(사망, 질병, 경제 문제 등)는 피해주세요.
            - 아래 입력 예시는 "질문: ~ / 답변: ~" 형식입니다.
            - 관련 이야기를 풀어낼수있게 유도하는 질문으로 생성해주세요.
            - **출력은 반드시 질문만 작성하며, 질문 사이를 빈 줄(\\n\\n)로 구분해주세요.**
        
            입력:
        """);

        List<SurveyQAResponse> todayAnswers = surveyService.getTodayPersonalQA(user.getId());

        for (SurveyQAResponse answer : todayAnswers) {
            promptBuilder.append("질문: ").append(answer.getQuestionContent()).append("\n")
                .append("답변: ").append(answer.getAnswerContent()).append("\n\n");
        }

        promptBuilder.append("이 사람을 위한 맞춤 회상 질문 3개를 생성해주세요.");

        String prompt = promptBuilder.toString();


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

        for (String question : questions) {
            PersonalQuestion personalQuestion = PersonalQuestion.builder()
                .content(question)
                .userId(user.getId())
                .createdAt(LocalDateTime.now())
                .build();
            genericPersistenceService.save(personalQuestion);
        }

    }
}
