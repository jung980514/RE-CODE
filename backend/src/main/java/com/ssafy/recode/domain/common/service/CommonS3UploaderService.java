package com.ssafy.recode.domain.common.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class CommonS3UploaderService implements S3UploaderService {

  private final S3Client s3Client;

  @Value("${cloud.aws.s3.bucket}")
  private String bucket;

  @Value("${aws.s3.prefix}")
  private String prefix;

  public CommonS3UploaderService(S3Client s3Client) {
    this.s3Client = s3Client;
  }

  /**
   * MP4 등 원본 미디어를 변환 없이 업로드
   */
  @Override
  public String uploadRawMedia(MultipartFile file, String folder) {
    try {
      String orig = file.getOriginalFilename();
      String base = (orig != null)
          ? orig.replaceFirst("\\.[^.]+$", "")
          : UUID.randomUUID().toString();
      String extension = (orig != null && orig.contains("."))
          ? orig.substring(orig.lastIndexOf('.'))
          : ".mp4";
      String uuid = UUID.randomUUID().toString();

      // 임시 파일 생성 (같은 확장자로)
      Path tmp = Files.createTempFile("media-", "-" + uuid + "-" + base + extension);
      file.transferTo(tmp.toFile());

      // S3에 업로드할 key: prefix/folder/UUID_base.extension
      String key = String.format("%s%s/%s_%s%s", prefix, folder, uuid, base, extension);
      s3Client.putObject(
          PutObjectRequest.builder()
              .bucket(bucket)
              .key(key)
              .build(),
          tmp
      );
      Files.deleteIfExists(tmp);
      return key;
    } catch (Exception e) {
      throw new RuntimeException("미디어 업로드 실패", e);
    }
  }
}
