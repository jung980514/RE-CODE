package com.ssafy.recode.domain.common.service;

import com.ssafy.recode.domain.basic.entity.BasicAnswer;
import com.ssafy.recode.domain.basic.repository.BasicAnswerRepository;
import com.ssafy.recode.domain.cognitive.entity.CognitiveAnswer;
import com.ssafy.recode.domain.cognitive.repository.CognitiveAnswerRepository;
import com.ssafy.recode.domain.personal.entity.PersonalAnswer;
import com.ssafy.recode.domain.personal.repository.PersonalAnswerRepository;
import com.ssafy.recode.domain.personal.repository.PersonalQuestionRepository;
import com.ssafy.recode.domain.survey.repository.SurveyRepository;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * GenericPersistenceService
 *
 * @author 김영민
 * @since 2025. 8. 6.
 */
@Service
@RequiredArgsConstructor
public class GenericPersistenceService {

    // 모든 답변 리포지토리를 주입받습니다.
    private final BasicAnswerRepository basicAnswerRepository;
    private final PersonalAnswerRepository personalAnswerRepository;
    private final CognitiveAnswerRepository cognitiveAnswerRepository;
    private final SurveyRepository surveyRepository;
    // 개인화 질문 리포지토리
    private final PersonalQuestionRepository personalQuestionRepository;

    // 엔티티 클래스 타입을 Key로, 해당 리포지토리를 Value로 갖는 맵
    private final Map<Class<?>, JpaRepository<?, ?>> repositoryMap = new HashMap<>();

    /**
     * 서비스가 초기화될 때, 각 엔티티 클래스와 리포지토리를 매핑합니다
     */
    @PostConstruct
    public void init(){
        repositoryMap.put(BasicAnswer.class, basicAnswerRepository);
        repositoryMap.put(PersonalAnswer.class, personalAnswerRepository);
        repositoryMap.put(CognitiveAnswer.class, cognitiveAnswerRepository);
        repositoryMap.put(SurveyRepository.class, surveyRepository);
        repositoryMap.put(PersonalQuestionRepository.class, personalQuestionRepository);
    }

    /**
     * 제네릭을 사용하여 모든 엔티티를 저장하는 단일 메서드
     * @param entity
     * @param <T>
     */
    @Transactional
    public <T> void save(T entity) {
        if(entity == null){
            throw new IllegalArgumentException("저장할 엔티티는 null일 수 없습니다.");
        }

        JpaRepository repository = repositoryMap.get(entity.getClass());

        if(repository == null){
            throw new IllegalArgumentException("지원되지 않는 엔티티 타입입니다: " + entity.getClass().getName());
        }

        repository.save(entity);
    }
}
