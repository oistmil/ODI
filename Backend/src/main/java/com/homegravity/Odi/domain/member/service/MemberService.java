package com.homegravity.Odi.domain.member.service;

import com.homegravity.Odi.domain.member.dto.MemberBrixDTO;
import com.homegravity.Odi.domain.member.dto.request.MemberBrixListRequestDTO;
import com.homegravity.Odi.domain.member.dto.request.MemberUpdateRequestDTO;
import com.homegravity.Odi.domain.member.dto.response.MemberPartyHistoryResponseDTO;
import com.homegravity.Odi.domain.member.dto.response.MemberResponseDTO;
import com.homegravity.Odi.domain.member.entity.Member;
import com.homegravity.Odi.domain.member.entity.MemberReview;
import com.homegravity.Odi.domain.member.repository.MemberRepository;
import com.homegravity.Odi.domain.member.repository.MemberReviewRepository;
import com.homegravity.Odi.domain.party.entity.Party;
import com.homegravity.Odi.domain.party.entity.PartyMember;
import com.homegravity.Odi.domain.party.entity.RoleType;
import com.homegravity.Odi.domain.party.entity.StateType;
import com.homegravity.Odi.domain.party.respository.PartyMemberRepository;
import com.homegravity.Odi.domain.party.respository.PartyRepository;
import com.homegravity.Odi.global.entity.S3Folder;
import com.homegravity.Odi.global.response.error.ErrorCode;
import com.homegravity.Odi.global.response.error.exception.BusinessException;
import com.homegravity.Odi.global.service.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository memberRepository;
    private final PartyRepository partyRepository;
    private final MemberReviewRepository memberReviewRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final S3Service s3Service;

    private double KIND_PERCENT = 0.3;
    private double PROMISE_PERCENT = 0.1;
    private double FASTCHAT_PERCENT = 0.2;

    // 사용자 상세정보 조회
    public MemberResponseDTO getMemberInfo(Member member) {
        return MemberResponseDTO.from(member);
    }

    //사용자 정보 수정
    public MemberResponseDTO updateMemberInfo(MemberUpdateRequestDTO memberUpdateRequestDTO, Member member) {
        if (memberUpdateRequestDTO.getNewNickname()!=null) {
            boolean IsExistNickname = memberRepository.existsByNicknameAndDeletedAtIsNull(memberUpdateRequestDTO.getNewNickname());

            if (IsExistNickname) {//이미 존재하는 닉네임이면 변경 불가
                throw BusinessException.builder().errorCode(ErrorCode.NICKNAME_ALREADY_EXIST).message(ErrorCode.NICKNAME_ALREADY_EXIST.getMessage()).build();
            }
            //member nickname 업데이트
            member.updateNickname(memberUpdateRequestDTO.getNewNickname());
        }

        //이미지를 변경한다면
        if (memberUpdateRequestDTO.getNewImage()!=null) {
            String oldImgS3Url = member.getImage();
            String newImgS3Url = s3Service.saveFile(memberUpdateRequestDTO.getNewImage(), S3Folder.PROFILE_IMAGE);

            s3Service.deleteFile(oldImgS3Url);
            member.updateImage(newImgS3Url);
        }

        memberRepository.save(member);

        return MemberResponseDTO.from(member);
    }

    //동승자 평가
    public Long createMemberBrix(MemberBrixListRequestDTO memberBrixListRequestDTO, Member reviewer) {

        Party party = partyRepository.findParty(memberBrixListRequestDTO.getPartyId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND_ERROR, "파티를 찾을 수 없습니다."));

        for (MemberBrixDTO memberBrixDTO : memberBrixListRequestDTO.getMemberBrixDTOList()) {
            Member reviewee = memberRepository.findByIdAndDeletedAtIsNull(memberBrixDTO.getReviewee_id())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_ID_NOT_EXIST, ErrorCode.MEMBER_ID_NOT_EXIST.getMessage()));

            memberReviewRepository.save(MemberReview.of(memberBrixDTO, reviewee, party.getId(), reviewer));
        }
        return party.getId();
    }


    @Scheduled(fixedDelay = 3600000, zone = "Asia/Seoul")//이전 task의 종료시점 이후 1시간 후 실행
    public void chekckMemberBrix() {
        //log.info("작업 종료 후 1분 뒤 실행 => time: {}", LocalTime.now());

        List<Party> partyList = partyRepository.findAllPartiedsSettlingSettled();

        for (Party party : partyList) {
            //아직 정산중일 경우
            if (party.getState().equals(StateType.SETTLING)) {

                //정산시작 날의 3일 안 지났으면 아직 대기
                if (party.getModifiedAt().plusDays(3).isAfter(LocalDateTime.now())) continue;
            }

            //정산중이더라도 3일 지났으면 리뷰를 바탕으로 매너 점수 처리 진행

            List<PartyMember> partyMemberList = partyMemberRepository.findAllPartyMember(party);

            for (PartyMember partyMember : partyMemberList) {
                //이미 매너점수 계산 완료 됐는지 체크
                if (partyMember.getIsBrix()) continue;

                int kindScore = 0;
                int promiseScore = 0;
                int fastChatScore = 0;
                double all = 0.0;

                //정산 안 한 사용자 있으면
                if (!partyMember.getIsPaid()) {
                    all -= 4.0; //감점 4점 주고 시작
                    //log.info("{}님이 정산하지 않아 매너점수 감점.", partyMember.getMember().getName());
                }
                List<MemberReview> memberReviewList = memberReviewRepository.findAllMemberReview(partyMember.getMember(), party.getId());

                for (MemberReview memberReview : memberReviewList) {
                    kindScore += memberReview.getKindScore();
                    promiseScore += memberReview.getPromiseScore();
                    fastChatScore += memberReview.getFastChatScore();

                    Member reviewer = memberRepository.findByIdAndDeletedAtIsNull(memberReview.getReviewerId())
                            .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_ID_NOT_EXIST, ErrorCode.MEMBER_ID_NOT_EXIST.getMessage()));

                    //리뷰 단 사람 추가 점수 부가
                    reviewer.updateBrix(0.05);
                    memberRepository.save(reviewer);
                }

                double kind = kindScore / 5.0 / memberReviewList.size() * KIND_PERCENT;
                double promise = promiseScore / 5.0 / memberReviewList.size() * PROMISE_PERCENT;
                double fastChat = fastChatScore / 5.0 / memberReviewList.size() * FASTCHAT_PERCENT;

                //기본점수 0.5 + 평가 평균점수
                all = 0.5 + kind + promise + fastChat;
                log.info("{} 의 이번 합승 점수는: {}", partyMember.getMember().getEmail(), all);

                Member updateMember = partyMember.getMember();
                updateMember.updateBrix(all);
                memberRepository.save(updateMember);

                partyMember.updateIsBrix(true);
                partyMemberRepository.save(partyMember);
            }
        }
    }

    //파티 이용 내역 조회
    public Slice<MemberPartyHistoryResponseDTO> getPartyHistory(Member member, String range, Pageable pageable) {

        if (range.equals("all")) {//모두 조회
            return partyMemberRepository.findAllPartyMemberByMember(member, RoleType.REQUESTER, pageable, true);
        } else if (range.equals("organizer")) {// 내가 파티장인거 조회
            return partyMemberRepository.findAllPartyMemberByMember(member, RoleType.ORGANIZER, pageable, false);
        } else if (range.equals("other")) {//파티장 아닌데 내가 참여한거
            return partyMemberRepository.findAllPartyMemberByMember(member, RoleType.PARTICIPANT, pageable, false);
        }
        return null;

    }
}
