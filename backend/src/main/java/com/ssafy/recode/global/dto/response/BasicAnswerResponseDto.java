package com.ssafy.recode.global.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "기본 답변 제출 응답 DTO")
public class BasicAnswerResponseDto {

    @Schema(description = "처리 결과 메시지", example = "업로드 완료, 평가를 진행 중입니다.")
    private String message;
}
