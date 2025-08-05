package com.ssafy.recode.domain.link.repository;

import com.ssafy.recode.global.dto.response.link.ElderSummaryResponse;
import com.ssafy.recode.global.dto.response.link.GuardianSummaryResponse;
import java.util.List;

public interface GuardianElderCustomRepository {

  List<ElderSummaryResponse> findLinkedEldersByGuardianId(Long guardianId);

  List<GuardianSummaryResponse> findLinkedGuardiansByElderId(Long elderId);
}
