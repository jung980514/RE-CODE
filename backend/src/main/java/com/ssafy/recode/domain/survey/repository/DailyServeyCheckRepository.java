package com.ssafy.recode.domain.survey.repository;

import com.ssafy.recode.domain.survey.entity.SurveyAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface DailyServeyCheckRepository extends JpaRepository<SurveyAnswer, Integer> {

    /**
     *
     *오늘 하루 동안 해당 사용자의 답변이 존재하는지 확인
     *
     *@param userId 사용자 아이디
     *@param start 당일 0시
     *@param end 당일 24시
     *@return true: 존재함, false: 없음
     *
     */
    boolean existsByUserIdAndCreatedAtBetween(
            Long userId,
            LocalDateTime start,
            LocalDateTime end);

}