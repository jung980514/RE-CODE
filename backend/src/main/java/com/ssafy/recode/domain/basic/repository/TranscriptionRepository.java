package com.ssafy.recode.domain.basic.repository;

import com.ssafy.recode.domain.basic.entity.Transcription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranscriptionRepository extends JpaRepository<Transcription, Long> {
}
