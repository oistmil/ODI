package com.homegravity.Odi.domain.member.controller;

import com.homegravity.Odi.domain.member.dto.request.MemberBrixListRequestDTO;
import com.homegravity.Odi.domain.member.dto.request.MemberUpdateRequestDTO;
import com.homegravity.Odi.domain.member.dto.response.MemberPartyHistoryResponseDTO;
import com.homegravity.Odi.domain.member.dto.response.MemberResponseDTO;
import com.homegravity.Odi.domain.member.entity.Member;
import com.homegravity.Odi.domain.member.service.MemberService;
import com.homegravity.Odi.domain.party.dto.PartyDTO;
import com.homegravity.Odi.global.response.success.ApiResponse;
import com.homegravity.Odi.global.response.success.SuccessCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "사용자 정보", description = "사용자 상세정보 조회/수정")
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService;

    @Operation(summary = "사용자 정보 조회", description = "사용자의 상세정보를 조회합니다.")
    @GetMapping("/me")
    public ApiResponse<MemberResponseDTO> getMemberInfo(@AuthenticationPrincipal Member member) {
        return ApiResponse.of(SuccessCode.MEMBER_GET_SUCCESS, memberService.getMemberInfo(member));
    }

    @Operation(summary = "회원정보 수정", description = "회원 정보(닉네임, 사진) 변경합니다. 닉네임 변경의 경우 중복되지 않는 닉네임으로 변경 가능하도록 합니다.")
    @PutMapping("/me")
    public ApiResponse<MemberResponseDTO> updateMemberInfo(MemberUpdateRequestDTO memberUpdateRequestDTO, @RequestParam(value = "newImage", required = false)MultipartFile newImage, @AuthenticationPrincipal Member member) {
        return ApiResponse.of(SuccessCode.MEMBER_UPDATE_SUCCESS, memberService.updateMemberInfo(memberUpdateRequestDTO, newImage, member));
    }

    @Operation(summary = "동승자 합승 후 평가", description = "동승자와 합승을 끝낸 후 동승자들을 평가한다(매너 및 시간 체크)")
    @PostMapping("/brix")
    public ApiResponse<Long> createMemberBrix(@RequestBody MemberBrixListRequestDTO memberBrixListRequestDTO, @AuthenticationPrincipal Member member) {
        return ApiResponse.of(SuccessCode.PARTY_MEMBER_CREATE_BRIX_SUCCESS, memberService.createMemberBrix(memberBrixListRequestDTO, member));
    }

    @Operation(summary = "동승 파티 이용 내역 조회", description = "동승 파티를 이용한 내역을 조회합니다.(전체, 내가 파티장, 내가 참여자 의 경우로 3가지로 나눠서 조회")
    @GetMapping("/me/party")
    public ApiResponse<Slice<MemberPartyHistoryResponseDTO>>getPartyHistory(@AuthenticationPrincipal Member member, @RequestParam("range") String range, Pageable pageable){
        return ApiResponse.of(SuccessCode.PARTY_LIST_GET_SUCCESS, memberService.getPartyHistory(member, range, pageable));
    }
}
