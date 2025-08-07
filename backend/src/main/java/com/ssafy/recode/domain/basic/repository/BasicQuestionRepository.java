package com.ssafy.recode.domain.basic.repository;

import com.ssafy.recode.domain.basic.entity.BasicQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BasicQuestionRepository extends JpaRepository<BasicQuestion, Long> {

  /**
   * 주어진 questionId 보다 큰 것 중에서 ID 오름차순으로 상위 3개를 가져옵니다.
   */
  List<BasicQuestion> findTop3ByIdGreaterThanOrderByIdAsc(Long lastId);

  /**
   * 모든 질문 중 ID 오름차순으로 상위 3개를 가져옵니다.
   * (답변이 한 번도 없거나, 끝까지 다 읽어서 리셋할 때 사용)
   */
  List<BasicQuestion> findTop3ByOrderByIdAsc();
}
