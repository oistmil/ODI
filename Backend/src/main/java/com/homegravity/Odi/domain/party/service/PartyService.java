package com.homegravity.Odi.domain.party.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.homegravity.Odi.domain.chat.repository.ChatRoomRepository;
import com.homegravity.Odi.domain.map.service.MapService;
import com.homegravity.Odi.domain.match.dto.MatchRequestDTO;
import com.homegravity.Odi.domain.member.entity.Member;
import com.homegravity.Odi.domain.member.repository.MemberRepository;
import com.homegravity.Odi.domain.party.dto.PartyDTO;
import com.homegravity.Odi.domain.party.dto.PartyMemberDTO;
import com.homegravity.Odi.domain.party.dto.request.PartyRequestDTO;
import com.homegravity.Odi.domain.party.dto.request.SelectPartyRequestDTO;
import com.homegravity.Odi.domain.party.dto.response.PartyChatInfoResponseDTO;
import com.homegravity.Odi.domain.party.dto.response.PartyResponseDTO;
import com.homegravity.Odi.domain.party.entity.*;
import com.homegravity.Odi.domain.party.respository.PartyBoardStatsRepository;
import com.homegravity.Odi.domain.party.respository.PartyDocumentRepository;
import com.homegravity.Odi.domain.party.respository.PartyMemberRepository;
import com.homegravity.Odi.domain.party.respository.PartyRepository;
import com.homegravity.Odi.global.redis.handler.TransactionHandler;
import com.homegravity.Odi.global.redis.repository.RedisLockRepository;
import com.homegravity.Odi.global.redis.repository.RedissonLockRepository;
import com.homegravity.Odi.global.response.error.ErrorCode;
import com.homegravity.Odi.global.response.error.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartyService {

    private final PartyRepository partyRepository;
    private final PartyDocumentRepository partyDocumentRepository;
    private final PartyBoardStatsRepository partyBoardStatsRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final MemberRepository memberRepository;
    private final ChatRoomRepository chatRoomRepository;

    private final MapService mapService;
    private final RedisLockRepository redisLockRepository;
    private final RedissonLockRepository redissonLockRepository;
    private final TransactionHandler transactionHandler;

    @Transactional
    public Long createParty(PartyRequestDTO partyRequestDTO, Member member) throws JsonProcessingException {

        String roomId = chatRoomRepository.createChatRoom();
        Party party = partyRepository.save(Party.of(partyRequestDTO, member.getGender(), roomId));
        partyDocumentRepository.save(PartyDocument.from(party)); // elasticsearch 저장

        PartyBoardStats partyBoardStats = PartyBoardStats.of(0, 0); // 생성시 조회수 초기화
        partyMemberRepository.save(PartyMember.of(RoleType.ORGANIZER, false, party, member));
        partyBoardStats.updateParty(party);

        return party.getId();
    }

    @Transactional
    public PartyResponseDTO getPartyDetail(Long partyId, Member member) {

        Party party = partyRepository.findParty(partyId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_ERROR, ErrorCode.NOT_FOUND_ERROR.getMessage()));

        // 조회수, 신청자 수 갱신
        PartyBoardStats partyBoardStats = partyBoardStatsRepository.findPartyBoardStats(party);
        partyBoardStats.addViewCount(); // 조회수 증가

        // 파티 참여 신청자 수 조회
        // TODO: 리팩토링
        partyBoardStats.updateRequestCount(partyMemberRepository.countAllPartyGuests(party));

        // 파티원, 파티 참여 신정자 목록 조회
        // TODO: 리팩토링
        RoleType role = partyMemberRepository.findParticipantRole(party, member);

        List<PartyMemberDTO> guests = null;
        if (role != null && role.equals(RoleType.ORGANIZER)) { // 방장이라면 신청자 목록도 조회 가능
            guests = partyMemberRepository.findAllPartyMember(party, RoleType.REQUESTER);
        }

        List<PartyMemberDTO> participants = partyMemberRepository.findAllPartyMember(party, RoleType.PARTICIPANT);

        // Naver Map API 호출
        String pathInfo = mapService.getNaverPathInfo(party.getDeparturesLocation().getX(), party.getDeparturesLocation().getY(), party.getArrivalsLocation().getX(), party.getArrivalsLocation().getY());

        return PartyResponseDTO.of(party, partyBoardStats, role, participants, guests, pathInfo);
    }

    @Transactional(readOnly = true)
    public Slice<PartyDTO> getAllParties(Pageable pageable, SelectPartyRequestDTO requestDTO) {

        return partyRepository.findAllParties(pageable, requestDTO);
    }

    @Transactional
    public Long joinParty(Long partyId, Member member) {

        String key = "joinParty_" + partyId.toString() + "_" + member.getId();

        //lettuce를 활용한 스핀락 활용
        return redissonLockRepository.runOnRedissonLock(
                key, ()-> transactionHandler.runOnWriteTransaction(
                        ()-> joinPartyLogic(partyId, member)
                ));
    }

    @Transactional
    public Long joinPartyLogic(Long partyId, Member member) {
        Party party = getParty(partyId);

        //파티 정원이 다 찼을 경우
        if (Objects.equals(party.getCurrentParticipants(), party.getMaxParticipants())) {
            throw BusinessException.builder()
                    .errorCode(ErrorCode.PARTY_MEMBER_CNT_MAX).message(ErrorCode.PARTY_MEMBER_CNT_MAX.getMessage()).build();
        }

        //파티가 모집중이 아닐 경우
        if (!party.getState().equals(StateType.GATHERING)) {
            throw BusinessException.builder()
                    .errorCode(ErrorCode.PARTY_NOT_GATHERING_NOW).message(ErrorCode.PARTY_NOT_GATHERING_NOW.getMessage()).build();
        }

        boolean isPartyMember = partyMemberRepository.existPartyMember(party, member);

        // 해당 파티에 이미 신청하려는 사용자가 있다면 중복 신청 불가
        if (isPartyMember) {
            throw BusinessException.builder()
                    .errorCode(ErrorCode.PARTY_MEMBER_ALREADY_JOIN_EXIST).message(ErrorCode.PARTY_MEMBER_ALREADY_JOIN_EXIST.getMessage()).build();
        }

        PartyMember partyMember = PartyMember.of(RoleType.REQUESTER, false, party, member);

        partyMemberRepository.save(partyMember);

        return partyMember.getId();
    }

    @Transactional
    public boolean deleteJoinParty(Long partyId, Member member) {
        String key = "deleteJoinParty" + partyId.toString() + "_" + member.getId();

        return redissonLockRepository.runOnRedissonLock(
                key, () -> transactionHandler.runOnWriteTransaction(
                        () -> deleteJoinPartyLogic(partyId, member)));
    }

    @Transactional
    public boolean deleteJoinPartyLogic(Long partyId, Member member) {
        Party party = getParty(partyId);


        PartyMember partyMember = partyMemberRepository.findPartyPartiOrReqByMember(party, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTY_MEMBER_NOT_EXIST, ErrorCode.PARTY_MEMBER_NOT_EXIST.getMessage()));

        partyMemberRepository.delete(partyMember);

        //나간 사용자가 참여자였다면 현재 party 인원 감소
        if (partyMember.getRole().equals(RoleType.PARTICIPANT)) {
            party.updateCurrentParticipants(party.getCurrentParticipants() - 1);
        }

        return true;
    }

    //동승 신청 수락
    @Transactional
    public boolean acceptJoinParty(Long partyId, Long memberId, Member member) {
        Party party = getParty(partyId);

        RoleType role = partyMemberRepository.findParticipantRole(party, member);

        //역할이 방장이 아니라면 권한 없음
        if (role != RoleType.ORGANIZER) {
            throw BusinessException.builder()
                    .errorCode(ErrorCode.FORBIDDEN_ERROR).message("파티장만 수락 요청 할 수 있습니다.").build();
        }

        //신청자 member 정보
        Member requester = memberRepository.findByIdAndDeletedAtIsNull(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_ID_NOT_EXIST, ErrorCode.MEMBER_ID_NOT_EXIST.getMessage()));

        //신청자 partyMember 정보
        PartyMember partyMember = partyMemberRepository.findPartyPartiOrReqByMember(party, requester)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTY_MEMBER_NOT_EXIST, ErrorCode.PARTY_MEMBER_NOT_EXIST.getMessage()));

        //신청자가 아니면 이미 파티 참여자임
        if (partyMember.getRole() != RoleType.REQUESTER) {
            throw BusinessException.builder()
                    .errorCode(ErrorCode.PARTY_MEMBER_ALREADY_EXIST).message(ErrorCode.PARTY_MEMBER_NOT_EXIST.getMessage()).build();
        }
        //파티 신청자를 참여자로 update
        partyMember.updatePartyRole(RoleType.PARTICIPANT);

        party.updateCurrentParticipants(party.getCurrentParticipants() + 1);

        return true;
    }

    //파티장의 파티 참여자 및 신청자 거절하기
    @Transactional
    public boolean refuseJoinParty(Long partyId, Long memberId, Member member) {
        Party party = getParty(partyId);

        RoleType role = partyMemberRepository.findParticipantRole(party, member);

        //역할이 방장이 아니라면 권한 없음
        if (role != RoleType.ORGANIZER) {
            throw BusinessException.builder()
                    .errorCode(ErrorCode.FORBIDDEN_ERROR).message("파티장만 거절 요청 할 수 있습니다.").build();
        }

        //신청자 member 정보
        Member requester = memberRepository.findByIdAndDeletedAtIsNull(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_ID_NOT_EXIST, ErrorCode.MEMBER_ID_NOT_EXIST.getMessage()));

        //partyMember 정보
        PartyMember partyMember = partyMemberRepository.findPartyPartiOrReqByMember(party, requester)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTY_MEMBER_NOT_EXIST, ErrorCode.PARTY_MEMBER_NOT_EXIST.getMessage()));

        //반환을 위한 roleTyle 받기
        //String roleType = partyMember.getRole().toString();

        //삭제
        partyMemberRepository.delete(partyMember);

        //참여자를 내보내기 했다면, 현재 파티 인원 감소
        if (partyMember.getRole().equals(RoleType.PARTICIPANT)) {
            party.updateCurrentParticipants(party.getCurrentParticipants() - 1);
        }

        return true;
    }

    @Transactional
    public Long updateParty(Long partyId, PartyRequestDTO partyRequestDTO, Member member) {

        Party party = partyRepository.findParty(partyId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_ERROR, ErrorCode.NOT_FOUND_ERROR.getMessage()));

        // 요청자와 작성자가 동일인인지 확인
        if (!partyMemberRepository.findParticipantRole(party, member).equals(RoleType.ORGANIZER)) {
            throw new BusinessException(ErrorCode.PARTY_MEMBER_ACCESS_DENIED, ErrorCode.PARTY_MEMBER_ACCESS_DENIED.getMessage());
        }

        if (!partyRequestDTO.getTitle().equals("")) {
            party.updateTitle(partyRequestDTO.getTitle());
        }

        if (!partyRequestDTO.getDeparturesName().equals("")) {
            party.updateDeparturesName(partyRequestDTO.getDeparturesName());
        }

        if (partyRequestDTO.getDeparturesLocation() != null) {
            party.updateDeparturesLocation(partyRequestDTO.getDeparturesLocation());
        }

        if (!partyRequestDTO.getArrivalsName().equals("")) {
            party.updateArrivalsName(partyRequestDTO.getArrivalsName());
        }

        if (partyRequestDTO.getArrivalsLocation() != null) {
            party.updateArrivalsLocation(partyRequestDTO.getArrivalsLocation());
        }

        if (partyRequestDTO.getDeparturesDate() != null) {
            party.updateDeparturesDate(partyRequestDTO.getDeparturesDate());
        }

        if (partyRequestDTO.getMaxParticipants() != null) {

            if (partyRequestDTO.getMaxParticipants() < party.getCurrentParticipants()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST_ERROR, "현재 인원 수가 참여 가능한 인원 수보다 많습니다.");
            }
            party.updateMaxParticipants(partyRequestDTO.getMaxParticipants());
        }

        if (partyRequestDTO.getCategory() != null) {
            party.updateCategory(partyRequestDTO.getCategory());
        }

        if (partyRequestDTO.getGenderRestriction() != null) {

            GenderType gender = GenderType.ANY;

            if (partyRequestDTO.getGenderRestriction().booleanValue()) { // 성별 제한이 있다면
                gender = GenderType.valueOf(member.getGender().toUpperCase());
            }

            party.updateGenderRestriction(gender);
        }

        if (!partyRequestDTO.getContent().equals("")) {
            party.updateContent(partyRequestDTO.getContent());
        }

        partyDocumentRepository.save(PartyDocument.from(party)); // elasticsearch 저장
        return party.getId();
    }

    // 파티 조회
    @Transactional(readOnly = true)
    public Party getParty(Long partyId) {
        return partyRepository.findParty(partyId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_ERROR, "파티를 찾을 수 없습니다."));
    }

    @Transactional
    public void deleteParty(Long partyId, Member member) {

        Party party = partyRepository.findParty(partyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_ERROR, "파티를 찾을 수 없습니다."));

        // 요청자와 작성자가 동일인인지 확인
        if (!partyMemberRepository.findParticipantRole(party, member).equals(RoleType.ORGANIZER)) {
            throw new BusinessException(ErrorCode.PARTY_MEMBER_ACCESS_DENIED, ErrorCode.PARTY_MEMBER_ACCESS_DENIED.getMessage());
        }

        // 정산완료 여부 확인
        if (party.getState() != StateType.SETTLED && party.getState() != StateType.GATHERING) {
            throw new BusinessException(ErrorCode.PARTY_SETTLEMENT_NOT_COMPLETED, "삭제할 수 없는 파티입니다.");
        }

        // party member 및 신청자 삭제
        List<PartyMember> partyMemberList = partyMemberRepository.findAllPartyMemberAndRequester(party);

        for (PartyMember pm : partyMemberList) {
            partyMemberRepository.delete(pm);
        }

        partyRepository.delete(party);

    }

    @Transactional(readOnly = true)
    public PartyChatInfoResponseDTO getPartyChatInfo(Long partyId, Member member) {
        Party party = partyRepository.findParty(partyId).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_ERROR, ErrorCode.NOT_FOUND_ERROR.getMessage()));

        // 조회 요청자 정보
        PartyMemberDTO me = PartyMemberDTO.fromMe(partyMemberRepository.findByPartyAndMember(party, member)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTY_MEMBER_NOT_EXIST, ErrorCode.PARTY_MEMBER_NOT_EXIST.getMessage())));

        // 파티장 정보
        PartyMemberDTO organizer = PartyMemberDTO.from(partyMemberRepository.findOrganizer(party)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTY_MEMBER_NOT_EXIST, ErrorCode.PARTY_MEMBER_NOT_EXIST.getMessage())));

        // 파티원 정보
        List<PartyMemberDTO> participants = partyMemberRepository.findAllParticipant(party, member);

        return PartyChatInfoResponseDTO.of(party, me, organizer, participants);
    }

    // 매치 파티 생성
    @Transactional
    public Long createMatchParty(Long member1, Long member2, MatchRequestDTO requestDTO1, MatchRequestDTO requestDTO2) throws JsonProcessingException {

        String roomId = chatRoomRepository.createChatRoom();
        Party party = partyRepository.save(Party.of(requestDTO1, roomId));

        Member organizer = memberRepository.findById(member1).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_ID_NOT_EXIST, ErrorCode.MEMBER_ID_NOT_EXIST.getMessage()));
        Member participant = memberRepository.findById(member2).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_ID_NOT_EXIST, ErrorCode.MEMBER_ID_NOT_EXIST.getMessage()));

        // partyMember 저장
        partyMemberRepository.save(PartyMember.of(RoleType.ORGANIZER, false, party, organizer));
        partyMemberRepository.save(PartyMember.of(RoleType.PARTICIPANT, false, party, participant));

        // party board stats 저장
        PartyBoardStats partyBoardStats = PartyBoardStats.of(0, 0);
        partyBoardStats.updateParty(party);

        return party.getId();
    }

}
