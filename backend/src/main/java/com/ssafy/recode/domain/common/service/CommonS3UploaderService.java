// src/main/java/com/ssafy/recode/domain/common/service/CommonS3UploaderService.java
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
    @Value("${ffmpeg.path}")
    private String ffmpegPath;

    public CommonS3UploaderService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String uploadAsWav(MultipartFile multipartFile, String folder) {
        try {
            String orig = multipartFile.getOriginalFilename();
            String base = (orig != null)
                ? orig.replaceFirst("\\.[^.]+$", "")
                : UUID.randomUUID().toString();
            String uuid = UUID.randomUUID().toString();
            Path tmpMp4 = Files.createTempFile("mp4-", "-" + uuid + ".mp4");
            multipartFile.transferTo(tmpMp4);

            // 1) MP4 업로드
            String mp4Key = prefix + folder + "/" + uuid + "_" + base + ".mp4";
            s3Client.putObject(
                PutObjectRequest.builder().bucket(bucket).key(mp4Key).build(),
                tmpMp4
            );

            // 2) WAV 변환
            Path tmpWav = tmpMp4.resolveSibling(uuid + "_" + base + ".wav");
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

            // 3) WAV 업로드
            String wavKey = prefix + folder + "/" + tmpWav.getFileName();
            s3Client.putObject(
                PutObjectRequest.builder().bucket(bucket).key(wavKey).build(),
                tmpWav
            );

            // 4) 임시 파일 삭제
            Files.deleteIfExists(tmpMp4);
            Files.deleteIfExists(tmpWav);

            return wavKey;
        } catch (Exception e) {
            throw new RuntimeException("S3 업로드 실패", e);
        }
    }
}
