package com.ssafy.recode.global.dto.response;

import com.ssafy.recode.domain.auth.entity.User;
import com.ssafy.recode.global.enums.Provider;
import com.ssafy.recode.global.enums.Role;
import java.time.LocalDate;
import lombok.Getter;

@Getter
public class UserProfileResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final LocalDate birthDate;
    private final String phone;
    private final Role role;
    private final String profileImageUrl; // Presigned URL을 담을 필드
    private final Provider provider;

    public UserProfileResponse(User user, String presignedUrl) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.birthDate = user.getBirthDate();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.profileImageUrl = presignedUrl;
        this.provider = user.getProvider();
    }

}
