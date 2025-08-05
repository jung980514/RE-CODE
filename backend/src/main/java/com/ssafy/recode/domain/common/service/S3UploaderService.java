// src/main/java/com/ssafy/recode/domain/common/service/S3UploaderService.java
package com.ssafy.recode.domain.common.service;

import org.springframework.web.multipart.MultipartFile;

public interface S3UploaderService {
    /**
     * @param file    업로드할 MP4 파일
     * @param folder  S3 키 접두사(ex: "basic", "personal")
     * @return        업로드된 WAV 파일의 S3 key
     */
    String uploadAsWav(MultipartFile file, String folder);
}
