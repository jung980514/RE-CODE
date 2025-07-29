package com.ssafy.recode.domain.basic.controller;

import com.ssafy.recode.domain.basic.service.VideoTranscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TranscribeController {

  private final VideoTranscriptionService svc;

  /**
   * 호출 예시: GET /api/transcribe?fileName=myvideo.mp4
   */
  @GetMapping("/transcribe")
  public ResponseEntity<String> transcribe(@RequestParam String fileName) {
    try {
      svc.transcribeFromS3(fileName);
      return ResponseEntity.ok("Transcription 성공 (콘솔 확인)");
    } catch (Exception e) {
      return ResponseEntity.status(500).body("오류: " + e.getMessage());
    }
  }
}
