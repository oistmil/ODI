package com.homegravity.Odi.domain.member.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.homegravity.Odi.domain.party.dto.LocationPoint;
import com.homegravity.Odi.domain.party.dto.PartyMemberDTO;
import com.homegravity.Odi.domain.party.entity.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;


@Schema(description = "개인 택시 파티 이용내역 DTO")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberPartyHistoryResponseDTO {

    @Schema(description = "파티 id")
    private Long id;

    @Schema(description = "파티 카테고리(대학교, 일상, ... 등)")
    private CategoryType category;

    @Schema(description = "성별제한(M, F, ANY) ")
    private GenderType genderRestriction; // M, F, ANY

    @Schema(description = "파티 생성 시간")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createAt;

    @Schema(description = "파티 최근 수정 시작")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime modifiedAt;

    @Schema(description = "파티 제목")
    private String title;

    @Schema(description = "출발지 이름")
    private String departuresName;

    @Schema(description = " 출발지 위치")
    private LocationPoint departuresLocation;

    @Schema(description = "도착지 이름")
    private String arrivalsName;

    @Schema(description = "도착지 위치")
    private LocationPoint arrivalsLocation;

    @Schema(description = "출발 시간")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime departuresDate;

    @Schema(description = "파티 참여 가능 최대 인원")
    private Integer maxParticipants;

    @Schema(description = "현재 파티 참여한 인원")
    private Integer currentParticipants;

    @Schema(description = "파티 상태")
    private StateType state;

    @Schema(description = "파티장 회원 정보")
    private PartyMemberDTO organizer;

    @Schema(description = "파티맴버 리스트(파티장 정보 포함)")
    private List<PartyMemberDTO> partyMemberDTOList;

    @Builder
    private MemberPartyHistoryResponseDTO(Long id, CategoryType category, GenderType genderRestriction, LocalDateTime createAt, LocalDateTime modifiedAt, String title, String departuresName, LocationPoint departuresLocation, String arrivalsName, LocationPoint arrivalsLocation, LocalDateTime departuresDate, Integer maxParticipants, Integer currentParticipants, StateType state, PartyMemberDTO organizer, List<PartyMemberDTO> partyMemberDTOList) {
        this.id = id;
        this.category = category;
        this.genderRestriction = genderRestriction;
        this.createAt = createAt;
        this.modifiedAt = modifiedAt;
        this.title = title;
        this.departuresName = departuresName;
        this.departuresLocation = departuresLocation;
        this.arrivalsName = arrivalsName;
        this.arrivalsLocation = arrivalsLocation;
        this.departuresDate = departuresDate;
        this.maxParticipants = maxParticipants;
        this.currentParticipants = currentParticipants;
        this.state = state;
        this.organizer = organizer;
        this.partyMemberDTOList = partyMemberDTOList;
    }

    public static MemberPartyHistoryResponseDTO of(Party party, List<PartyMemberDTO> partyMemberList){
        LocationPoint departuresLocation = LocationPoint.of(party.getDeparturesLocation().getX(), party.getDeparturesLocation().getY());
        LocationPoint arrivalsLocation = LocationPoint.of(party.getArrivalsLocation().getX(), party.getArrivalsLocation().getY());

        return builder()
                .id(party.getId())
                .category(party.getCategory())
                .genderRestriction(party.getGenderRestriction())
                .createAt(party.getCreatedAt())
                .modifiedAt(party.getModifiedAt())
                .title(party.getTitle())
                .departuresName(party.getDeparturesName())
                .departuresLocation(departuresLocation)
                .arrivalsName(party.getArrivalsName())
                .arrivalsLocation(arrivalsLocation)
                .departuresDate(party.getDeparturesDate())
                .maxParticipants(party.getMaxParticipants())
                .currentParticipants(party.getCurrentParticipants())
                .state(party.getState())
                .organizer(partyMemberList.get(0))
                .partyMemberDTOList(partyMemberList)
                .build();
    }
}
