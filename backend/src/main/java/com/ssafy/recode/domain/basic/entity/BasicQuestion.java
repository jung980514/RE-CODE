package com.ssafy.recode.domain.basic.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "basic_questions")
public class BasicQuestion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "question_id")
  private Long id;

  @Lob
  @Column(columnDefinition = "TEXT")
  private String content;

  @Column(name = "created_at")
  private LocalDateTime createdAt;
}