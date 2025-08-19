package com.ssafy.recode.domain.auth.service;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.domain.auth.repository.UserRepository;
import com.ssafy.recode.domain.common.service.S3UploaderService;
import com.ssafy.recode.domain.common.service.VideoTranscriptionService;
import com.ssafy.recode.global.constant.AuthConstant;
import com.ssafy.recode.global.dto.request.DeleteUserRequest;
import com.ssafy.recode.global.dto.request.RegisterRequest;
import com.ssafy.recode.global.dto.request.UpdateUserRequest;
import com.ssafy.recode.global.dto.response.UserProfileResponse;
import com.ssafy.recode.global.enums.Provider;
import com.ssafy.recode.global.enums.Role;
import com.ssafy.recode.global.error.CustomException;
import com.ssafy.recode.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * AuthService 일반 회원가입 기능 (역할 기반)
 */
@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final S3UploaderService s3UploaderService;
  private final VideoTranscriptionService videoTranscriptionService;

  public UserProfileResponse getUser(User user) {
    String profileImageUrl = user.getProfileImageUrl();
    String presignedUrl = null;
    if (profileImageUrl != null && !profileImageUrl.isEmpty()) {
      presignedUrl = videoTranscriptionService.presign(videoTranscriptionService.toS3Key(profileImageUrl), "image/jpeg", 15);
     }
     return new UserProfileResponse(user, presignedUrl);
    }

    public String getPresignedUrl(User user){
      String profileImageUrl = user.getProfileImageUrl();
      if (profileImageUrl != null && !profileImageUrl.isEmpty()) {
        return videoTranscriptionService.presign(videoTranscriptionService.toS3Key(profileImageUrl), "image/jpeg", 15);
      }else{
        return "";
      }
    }

  @Transactional
  public void register(RegisterRequest request, MultipartFile profileImageFile) {
    String email = request.getEmail();
    // 이메일 중복 검사
    if (userRepository.findByEmail(email).isPresent()) {
      throw new CustomException(ErrorCode.DUPLICATE_EMAIL);
    }

    // 소셜 계정 중복 검사 (카카오)
    String kakaoEmail = AuthConstant.KAKAO + " " + email;
    if (userRepository.findByEmail(kakaoEmail).isPresent()) {
      throw new CustomException(ErrorCode.DUPLICATE_KAKAO_EMAIL);
    }

    // 비밀번호 암호화
    String encodedPassword = passwordEncoder.encode(request.getPassword());

    //프로필 이미지
    String profileImageUrl = null;
    if (profileImageFile != null && !profileImageFile.isEmpty()) {
      profileImageUrl = s3UploaderService.uploadRawMedia(profileImageFile, "profile");
    }

    // 유저 엔티티 생성
    User user = User.fullBuilder()
        .name(request.getName())
        .email(email)
        .password(encodedPassword)
        .phone(request.getPhone())
        .birthDate(request.getBirthDate())
        .profileImageUrl(profileImageUrl)
        .role(request.getRole())
        .provider(Provider.LOCAL)
        .providerId(request.getEmail())
        .build();

    userRepository.save(user);
    // 역할 분기 후 추가 작업은 필요 시 이후 처리 가능
  }

  /**
   * 회원 정보 수정 (부분 업데이트)
   *
   * @param reqUser  수정할 회원
   * @param request 수정할 필드가 담긴 DTO
   * @return 수정된 회원 엔티티 (컨트롤러에서 DTO로 변환하여 응답)
   * <p>
   * 처리 로직: 1. 회원 존재 여부 확인 2. 입력값 유효성 검사 및 trim 처리 3. 전화번호 변경 시 중복 검사 4. 비밀번호 변경 시 현재 비밀번호 검증 및 새
   * 비밀번호 동일 여부 확인 5. JPA Dirty Checking으로 DB에 반영
   */
  @Transactional
  public User updateUser(User reqUser, UpdateUserRequest request, MultipartFile profileImage) {
    // 1) 회원 조회
    User user = userRepository.findById(reqUser.getId())
        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND_ERROR));

    // 2) 이름 변경
    String name = request.getName();
    if (name != null && !(name = name.trim()).isEmpty()) {
      user.setName(name);
    }

    // 3) 생년월일 변경
    if (request.getBirthDate() != null) {
      user.setBirthDate(request.getBirthDate());
    }

    // 4) 프로필 이미지 변경
    String profileImageUrl = null;
    if (profileImage != null && !profileImage.isEmpty()) {
      profileImageUrl = s3UploaderService.uploadRawMedia(profileImage, "profile");
      user.setProfileImageUrl(profileImageUrl);
    }

    // 5) 전화번호 변경 (중복 검사 + DB 유니크 충돌 처리)
    String phone = request.getPhone();
    if (phone != null && !(phone = phone.trim()).isEmpty()) {
      try {
        userRepository.findByPhone(phone)
            .filter(other -> !other.getId().equals(user.getId()))
            .ifPresent(other -> {
              throw new CustomException(ErrorCode.DUPLICATE_PHONE);
            });
        user.setPhone(phone);
      } catch (DataIntegrityViolationException e) {
        throw new CustomException(ErrorCode.DUPLICATE_PHONE);
      }
    }

    // 6) 비밀번호 변경 (LOCAL 계정만 가능)
    String newPw = request.getNewPassword();
    if (newPw != null && !(newPw = newPw.trim()).isEmpty()) {
      // 소셜 계정은 변경 불가
      if (user.getProvider() != Provider.LOCAL) {
        throw new CustomException(ErrorCode.SOCIAL_ACCOUNT_PASSWORD_CHANGE_NOT_ALLOWED);
      }
      // 현재 비밀번호 검증
      String curPw = request.getCurrentPassword();
      if (curPw == null || !passwordEncoder.matches(curPw, user.getPassword())) {
        throw new CustomException(ErrorCode.INVALID_PASSWORD);
      }
      // 새 비밀번호가 기존과 동일한지 체크
      if (passwordEncoder.matches(newPw, user.getPassword())) {
        throw new CustomException(ErrorCode.SAME_AS_OLD_PASSWORD);
      }
      // 암호화 후 저장
      user.setPassword(passwordEncoder.encode(newPw));
    }

    // 7) [카카오 처음 로그인시] 노인/보호자
    Role role = request.getRole();
    if(role != null && reqUser.getProvider() == Provider.KAKAO){
      user.setRole(role);
    }

    // 8) JPA Dirty Checking에 의해 자동 반영
    return user;
  }

  /**
   * 회원 탈퇴
   *
   * @param userId  탈퇴할 회원 ID
   * @param request LOCAL 계정인 경우 비밀번호 검증용 DTO
   *                <p>
   *                처리 로직: 1. 회원 존재 여부 확인 2. LOCAL 계정인 경우 비밀번호 검증 3. 회원 데이터 삭제 4. (선택) RefreshToken
   *                무효화 처리
   */
  @Transactional
  public void deleteUser(Long userId, DeleteUserRequest request) {
    // 1) 회원 조회
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND_ERROR));

    // 2) LOCAL 계정 비밀번호 검증
    if (user.getProvider() == Provider.LOCAL) {
      String pw = request.getPassword();
      if (pw == null || pw.isBlank() || !passwordEncoder.matches(pw, user.getPassword())) {
        throw new CustomException(ErrorCode.INVALID_PASSWORD);
      }
    }

    // 3) 회원 삭제
    userRepository.delete(user);

  }

}
