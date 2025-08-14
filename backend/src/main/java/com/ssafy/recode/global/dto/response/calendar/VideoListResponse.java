package com.ssafy.recode.global.dto.response.calendar;

import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class VideoListResponse {

  private LocalDate date;    // 조회 날짜
  private boolean hasData;   // 영상 존재 여부
  private List<VideoUrlItem> items; // 프론트에서 바로 쓸 Presigned URL
}
