package com.ssafy.recode.global.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
@Schema(name = "BasicAnswerRequest", description = "기초 답변 제출 요청 DTO")
public class BasicAnswerRequestDto {

    @NotNull
    @Schema(description = "basic_questions 테이블의 질문 ID", example = "1")
    private Long questionId;

    @NotNull
    @Schema(description = "요청한 사용자 ID", example = "42")
    private Long userId;

    @NotNull
    @Schema(description = "업로드할 MP4 비디오 파일", type = "string", format = "binary")
    private MultipartFile videoFile;
}
