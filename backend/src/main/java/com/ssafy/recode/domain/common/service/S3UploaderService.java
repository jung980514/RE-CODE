package com.ssafy.recode.domain.common.service;

import org.springframework.web.multipart.MultipartFile;

public interface S3UploaderService {

  /**
   * @param file   업로드할 원본 미디어 파일(MP4, WAV, 이미지 등)
   * @param folder S3 키 접두사 (예: "basic", "personal", "cognitive-sound", "cognitive-image")
   * @return       업로드된 S3 객체의 키
   */
  String uploadRawMedia(MultipartFile file, String folder);

}