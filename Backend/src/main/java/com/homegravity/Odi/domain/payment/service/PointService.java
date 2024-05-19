package com.homegravity.Odi.domain.payment.service;

import com.homegravity.Odi.domain.member.entity.Member;
import com.homegravity.Odi.domain.member.repository.MemberRepository;
import com.homegravity.Odi.domain.party.entity.Party;
import com.homegravity.Odi.domain.payment.dto.response.PointHistoryResponseDto;
import com.homegravity.Odi.domain.payment.entity.Payment;
import com.homegravity.Odi.domain.payment.entity.PointHistory;
import com.homegravity.Odi.domain.payment.entity.PointHistoryType;
import com.homegravity.Odi.domain.payment.repository.PointHistoryRepository;
import com.homegravity.Odi.global.response.error.ErrorCode;
import com.homegravity.Odi.global.response.error.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class PointService {

    private final MemberRepository memberRepository;
    private final PointHistoryRepository pointHistoryRepository;

    // 파티 선불/정산 및 내역 생성
    public void usePoint(Member member, Party party, int wholeCost, int memberCost, int paidAmount, PointHistoryType type) {

        // 포인트 사용
        if (member.getPoint() < memberCost - paidAmount) {
            throw new BusinessException(ErrorCode.POINT_LACK_ERROR, "포인트 부족으로 정산에 실패했습니다.");
        }
        member.updatePoint(paidAmount - memberCost);
        memberRepository.save(member);

        // 포인트 사용 내역 생성
        String detailContent = String.format("%s -> %s (%d원, %d명 동승)", party.getDeparturesName(), party.getArrivalsName(), wholeCost, party.getCurrentParticipants());
        pointHistoryRepository.save(PointHistory.createHistory(member, party.getId(), party.getTitle(), detailContent, type, paidAmount - memberCost));
    }

    // 정산 요청자 - 선불 금액 돌려받기
    public void getBackPrePaidCost(Member member, Party party, int cost) {
        member.updatePoint(cost);
        memberRepository.save(member);

        String detailContent = String.format("%s -> %s [선불 금액 반환]", party.getDeparturesName(), party.getArrivalsName());
        pointHistoryRepository.save(PointHistory.createHistory(member, party.getId(), party.getTitle(), detailContent, PointHistoryType.PAYER_SETTLEMENT, cost));
    }

    // 포인트 입금
    public void deposit(Member member, Party party, int wholeCost, int cost, String payer) {
        member.updatePoint(cost);
        memberRepository.save(member);

        String detailContent = String.format("%s -> %s (%d원, %d명 동승) [정산자 입금] %s님 정산", party.getDeparturesName(), party.getArrivalsName(), wholeCost, party.getCurrentParticipants(), payer);
        pointHistoryRepository.save(PointHistory.createHistory(member, party.getId(), party.getTitle(), detailContent, PointHistoryType.PAYER_SETTLEMENT, cost));
    }

    // 포인트 충전
    public void chargePoint(Payment payment) {
        payment.getCustomer().updatePoint(payment.getAmount());
        pointHistoryRepository.save(PointHistory.createHistory(payment.getCustomer(), payment.getId(), "포인트 충전", "", PointHistoryType.CHARGE, payment.getAmount()));
    }

    // 포인트 사용 내역
    public Slice<PointHistoryResponseDto> getPointHistory(Member member, Pageable pageable) {

        Pageable sortPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Order.desc("createdAt")));
        return pointHistoryRepository.findAllByMemberAndDeletedAtIsNull(member, pageable).map(PointHistoryResponseDto::from);
    }
}
