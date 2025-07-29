package com.ssafy.recode.domain.basic.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * S3UploaderService는 MP4 → WAV 변환 후
 * AWS S3의 ssafy-recode-bucket/answer/ 아래에 업로드하고
 * 업로드된 S3 키를 반환합니다.
 */
@Service
@RequiredArgsConstructor
public class S3UploaderService {

  private final S3Client s3Client;

  /** S3 버킷 이름 */
  @Value("${cloud.aws.s3.bucket}")
  private String bucket;

  /** S3 키 접두사, 반드시 “answer/” 로 끝나야 함 */
  @Value("${aws.s3.prefix}")
  private String prefix;

  /** ffmpeg 실행 경로 */
  @Value("${ffmpeg.path}")
  private String ffmpegPath;

  /**
   * MP4 MultipartFile을 받아 WAV 로 컨버팅 후 S3에 업로드.
   * @return S3 키, 예) answer/123e4567-abcd_intro.wav
   */
  public String uploadAsWav(MultipartFile multipartFile) {
    try {
      // 1) 임시 mp4 파일 생성
      String orig = multipartFile.getOriginalFilename();
      String base = orig != null
          ? orig.replaceFirst("\\.[^.]+$", "")
          : UUID.randomUUID().toString();
      String uuid = UUID.randomUUID().toString();

      Path tmpMp4 = Files.createTempFile("upload-mp4-", "-" + uuid + ".mp4");
      multipartFile.transferTo(tmpMp4);

      // 2) 임시 wav 파일 경로
      Path tmpWav = tmpMp4.resolveSibling(uuid + "_" + base + ".wav");

      // ffmpeg 로 wav 변환 (16kHz, mono)
      new ProcessBuilder(
          ffmpegPath,
          "-i", tmpMp4.toString(),
          "-ar", "16000",
          "-ac", "1",
          "-f", "wav",
          tmpWav.toString()
      )
          .inheritIO()
          .start()
          .waitFor();

      // 3) S3 에 업로드
      String fileName = tmpWav.getFileName().toString();               // "uuid_base.wav"
      String key      = prefix + fileName;                            // "answer/uuid_base.wav"
      s3Client.putObject(
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(key)
              .build(),
          tmpWav
      );

      // 4) 임시 파일 정리
      Files.deleteIfExists(tmpMp4);
      Files.deleteIfExists(tmpWav);

      // 5) 업로드된 S3 key 반환
      return key;

    } catch (Exception e) {
      throw new RuntimeException("S3UploaderService 실패: " + e.getMessage(), e);
    }
  }
}
