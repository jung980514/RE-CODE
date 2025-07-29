package com.ssafy.recode.domain.basic.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transcription {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String s3Key;
  @Lob
  private String transcript;

  private Instant createdAt;
}