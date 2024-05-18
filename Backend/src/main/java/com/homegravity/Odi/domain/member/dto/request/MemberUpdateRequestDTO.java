package com.homegravity.Odi.domain.member.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Schema(description = "사용자 정보 수정 요청 DTO")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberUpdateRequestDTO {

    @Schema(description = "수정하고자하는 새 닉네임")
    private String newNickname;

    // todo s3 설정 후 추후 추가 예정
    @Schema(description = "수정하려는 새 이미지")
    private MultipartFile newImage;

}
