package com.homegravity.Odi.domain.party.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.homegravity.Odi.domain.party.dto.PartyMemberDTO;
import com.homegravity.Odi.domain.party.entity.Party;
import com.homegravity.Odi.domain.party.entity.StateType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PartyChatInfoResponseDTO {

    @Schema(description = "파티 id")
    private Long partyId;

    @Schema(description = "파티 제목")
    private String title;

    @Schema(description = "파티 참여자 수")
    private Integer currentParticipants;

    @Schema(description = "출발지명")
    private String departuresName;

    @Schema(description = "도착지명")
    private String arrivalsName;

    @Schema(description = "출발 시간")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime departuresDate;

    @Schema(description = "파티 상태 - 모집중, 모집완료, 정산중, 정산완료")
    private StateType state;

    @Schema(description = "조회 요청자의 정보")
    private PartyMemberDTO me;

    @Schema(description = "파티장의 정보")
    private PartyMemberDTO organizer;

    @Schema(description = "파티 참여자들의 정보")
    private List<PartyMemberDTO> participants;

    @Schema(description = "채팅방 roomId")
    private String roomId;

    @Schema(description = "영수증 image")
    private String receiptImage;

    @Builder
    private PartyChatInfoResponseDTO(Long partyId, String title, Integer currentParticipants, String departuresName, String arrivalsName, LocalDateTime departuresDate, StateType state, PartyMemberDTO me, PartyMemberDTO organizer, List<PartyMemberDTO> participants, String roomId, String receiptImage) {
        this.partyId = partyId;
        this.title = title;
        this.currentParticipants = currentParticipants;
        this.departuresName = departuresName;
        this.arrivalsName = arrivalsName;
        this.departuresDate = departuresDate;
        this.state = state;
        this.me = me;
        this.organizer = organizer;
        this.participants = participants;
        this.roomId = roomId;
        this.receiptImage = receiptImage;
    }

    public static PartyChatInfoResponseDTO of(Party party, PartyMemberDTO me, PartyMemberDTO organizer, List<PartyMemberDTO> participants) {
        return PartyChatInfoResponseDTO.builder()
                .partyId(party.getId())
                .title(party.getTitle())
                .currentParticipants(party.getCurrentParticipants())
                .departuresName(party.getDeparturesName())
                .arrivalsName(party.getArrivalsName())
                .departuresDate(party.getDeparturesDate())
                .state(party.getState())
                .me(me)
                .organizer(organizer)
                .participants(participants)
                .roomId(party.getRoomId())
                .receiptImage((party.getState().equals(StateType.SETTLING) || party.getState().equals(StateType.SETTLED)) ? party.getPartySettlement().getImage() : null)
                .build();
    }
}
