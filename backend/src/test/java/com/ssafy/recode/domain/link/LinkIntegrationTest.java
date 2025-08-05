package com.ssafy.recode.domain.link;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.repository.UserRepository;
import com.ssafy.recode.domain.link.entity.GuardianElder;
import com.ssafy.recode.domain.link.entity.LinkRequest;
import com.ssafy.recode.domain.link.repository.GuardianElderRepository;
import com.ssafy.recode.domain.link.repository.LinkRequestRepository;
import com.ssafy.recode.global.dto.request.link.LinkApprovalRequest;
import com.ssafy.recode.global.dto.request.link.LinkRequestDto;
import com.ssafy.recode.global.dto.request.link.LinkUnlinkRequest;
import com.ssafy.recode.global.enums.LinkStatus;
import com.ssafy.recode.global.enums.Provider;
import com.ssafy.recode.global.enums.Role;
import com.ssafy.recode.global.security.util.JWTUtils;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class LinkIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private GuardianElderRepository guardianElderRepository;

	@Autowired
	private LinkRequestRepository linkRequestRepository;

	@Autowired
	private JWTUtils jwtUtils;

	private User elder;
	private User guardian;
	private Cookie elderAccessCookie;
	private Cookie guardianAccessCookie;

	@BeforeEach
	void setup() {
		elder = userRepository.save(User.fullBuilder()
			.email("elder@example.com")
			.name("피보호자")
			.birthDate(LocalDate.of(1950, 1, 1))
			.phone("010-1111-1111")
			.password("password")
			.provider(Provider.LOCAL)
			.role(Role.ELDER)
			.build());

		guardian = userRepository.save(User.fullBuilder()
			.email("guardian@example.com")
			.name("보호자")
			.birthDate(LocalDate.of(1980, 5, 5))
			.phone("010-2222-2222")
			.password("password")
			.provider(Provider.LOCAL)
			.role(Role.GUARDIAN)
			.build());

		// 테스트용 JWT 생성 및 쿠키 설정
		String elderToken = jwtUtils.generateAccessToken(elder.getUuid(), elder.getRole().name(), elder.getName(), elder.getEmail());
		elderAccessCookie = new Cookie("access_token", elderToken);

		String guardianToken = jwtUtils.generateAccessToken(guardian.getUuid(), guardian.getRole().name(), guardian.getName(), guardian.getEmail());
		guardianAccessCookie = new Cookie("access_token", guardianToken);
	}

	@Test
	@DisplayName("연결 성공 - 전체 시나리오 (토큰생성 -> 요청 -> 승인)")
	void linkSuccess_FullScenario() throws Exception {
		// 1. Given: 피보호자가 로그인하여 토큰 생성
		MvcResult tokenResult = mockMvc.perform(post("/api/link")
				.cookie(elderAccessCookie))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.data.token").exists())
			.andReturn();
		String linkToken = JsonPath.read(tokenResult.getResponse().getContentAsString(), "$.data.token");

		// 2. When: 보호자가 해당 토큰으로 연결 요청
		LinkRequestDto linkRequestDto = new LinkRequestDto(linkToken);
		mockMvc.perform(post("/api/link/req")
				.cookie(guardianAccessCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(linkRequestDto)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("연동 요청이 접수되었습니다."));

		// 3. Then: DB에 PENDING 상태의 요청이 생성되었는지 확인
		LinkRequest linkRequest = linkRequestRepository.findByElderIdAndGuardianId(elder.getId(), guardian.getId()).orElseThrow();
		assertThat(linkRequest.getStatus()).isEqualTo(LinkStatus.PENDING);

		// 4. When: 피보호자가 요청을 승인
		LinkApprovalRequest approvalRequest = new LinkApprovalRequest(guardian.getId(), linkToken, true);
		mockMvc.perform(post("/api/link/res")
				.cookie(elderAccessCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(approvalRequest)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("연동을 수락했습니다."));

		// 5. Then: 최종적으로 연결되었는지 확인
		assertThat(linkRequestRepository.findById(linkRequest.getId()).get().getStatus()).isEqualTo(LinkStatus.ACCEPTED);
		assertThat(guardianElderRepository.existsByGuardianIdAndElderId(guardian.getId(), elder.getId())).isTrue();
	}

	@Test
	@DisplayName("연결 거절 시나리오")
	void linkRejection_Scenario() throws Exception {
		// 1. Given: 보호자가 연결 요청까지 마친 상태
		MvcResult tokenResult = mockMvc.perform(post("/api/link").cookie(elderAccessCookie)).andReturn();
		String linkToken = JsonPath.read(tokenResult.getResponse().getContentAsString(), "$.data.token");
		mockMvc.perform(post("/api/link/req").cookie(guardianAccessCookie).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(new LinkRequestDto(linkToken))));
		LinkRequest linkRequest = linkRequestRepository.findByElderIdAndGuardianId(elder.getId(), guardian.getId()).orElseThrow();

		// 2. When: 피보호자가 요청을 거절
		LinkApprovalRequest approvalRequest = new LinkApprovalRequest(guardian.getId(), linkToken, false);
		mockMvc.perform(post("/api/link/res")
				.cookie(elderAccessCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(approvalRequest)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("연동 요청을 거절했습니다."));

		// 3. Then: 요청 상태가 DENIED로 변경되고, 연결되지 않았는지 확인
		assertThat(linkRequestRepository.findById(linkRequest.getId()).get().getStatus()).isEqualTo(LinkStatus.REJECTED);
		assertThat(guardianElderRepository.existsByGuardianIdAndElderId(guardian.getId(), elder.getId())).isFalse();
	}

	@Test
	@DisplayName("연결 끊기 시나리오 (보호자 요청)")
	void unlink_Scenario() throws Exception {
		// 1. Given: 이미 연결된 상태
		guardianElderRepository.save(GuardianElder.builder().elderId(elder.getId()).guardianId(guardian.getId()).build());
		assertThat(guardianElderRepository.existsByGuardianIdAndElderId(guardian.getId(), elder.getId())).isTrue();

		// 2. When: 보호자가 피보호자와의 연결 끊기 요청
		LinkUnlinkRequest unlinkRequest = new LinkUnlinkRequest(elder.getId());
		mockMvc.perform(delete("/api/link/unlink")
				.cookie(guardianAccessCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(unlinkRequest)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("연동이 해제되었습니다."));

		// 3. Then: 연결 정보가 삭제되었는지 확인
		assertThat(guardianElderRepository.existsByGuardianIdAndElderId(guardian.getId(), elder.getId())).isFalse();
	}

	@Test
	@DisplayName("유효하지 않은 토큰으로 연결 요청 시 예외 발생")
	void requestLink_withInvalidToken_throwsException() throws Exception {
		// Given
		LinkRequestDto linkRequestDto = new LinkRequestDto("invalid-token");

		// When & Then
		mockMvc.perform(post("/api/link/req")
				.cookie(guardianAccessCookie)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(linkRequestDto)))
			.andExpect(status().isBadRequest()) // 400 Bad Request
			.andExpect(jsonPath("$.message").value("유효하지 않은 토큰입니다."));
	}
}