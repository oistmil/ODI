package com.homegravity.Odi.domain.payment.dto.toss;

public enum PaymentStatus {

    NOT_STARTED, // 시작 전
    EXECUTING, // 승인 중
    SUCCESS, // 완료
    FAILURE, // 실패
    UNKNOWN // 알 수 없는 상태
}
