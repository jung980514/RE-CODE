package com.ssafy.recode.domain.personal.service;

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
 * PersonalS3UploaderService는 MP4 → WAV 변환 후
 * AWS S3의 {bucket}/{prefix}personal/ 아래에 업로드하고
 * 업로드된 S3 키를 반환합니다.
 */
@Service
@RequiredArgsConstructor
public class PersonalS3UploaderService {
  private final S3Client s3Client;

  @Value("${cloud.aws.s3.bucket}")
  private String bucket;

  @Value("${aws.s3.prefix}")
  private String prefix;

  @Value("${ffmpeg.path}")
  private String ffmpegPath;

  public String uploadAsWav(MultipartFile multipartFile) {
    try {
      // 1) 임시 MP4 파일 생성
      String orig = multipartFile.getOriginalFilename();
      String base = orig != null
          ? orig.replaceFirst("\\.[^.]+$", "")
          : UUID.randomUUID().toString();
      String uuid = UUID.randomUUID().toString();
      Path tmpMp4 = Files.createTempFile("upload-mp4-", "-" + uuid + ".mp4");
      multipartFile.transferTo(tmpMp4);

      // 2) MP4를 S3에 업로드 (personal/)
      String mp4FileName = uuid + "_" + base + ".mp4";
      String mp4Key      = prefix + "personal/" + mp4FileName;
      s3Client.putObject(
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(mp4Key)
              .build(),
          tmpMp4
      );
      System.out.println("📤 MP4 업로드 완료: " + mp4Key);

      // 3) 임시 WAV 파일 경로 생성
      Path tmpWav = tmpMp4.resolveSibling(uuid + "_" + base + ".wav");

      // 4) ffmpeg 로 WAV 변환 (16kHz, mono)
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

      // 5) WAV를 S3에 업로드 (personal/)
      String wavFileName = tmpWav.getFileName().toString();
      String wavKey      = prefix + "personal/" + wavFileName;
      s3Client.putObject(
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(wavKey)
              .build(),
          tmpWav
      );
      System.out.println("📤 WAV 업로드 완료: " + wavKey);

      // 6) 임시 파일 삭제
      Files.deleteIfExists(tmpMp4);
      Files.deleteIfExists(tmpWav);

      // 7) 변환된 WAV 키 반환
      return wavKey;

    } catch (Exception e) {
      throw new RuntimeException("PersonalS3UploaderService 실패: " + e.getMessage(), e);
    }
  }
}
