// src/main/java/com/ssafy/recode/domain/common/service/PromptEvaluationService.java
package com.ssafy.recode.domain.common.service;

public interface PromptEvaluationService {
    /**
     * @param question  질문 원문
     * @param answer    전사된 답변 텍스트
     * @return          0~100 사이의 평가 점수
     */
    double evaluateAnswer(String question, String answer) throws Exception;
}
