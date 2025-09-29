package com.homegravity.Odi.domain.payment.service;

import com.homegravity.Odi.domain.member.entity.Member;
import com.homegravity.Odi.domain.payment.dto.PaymentFailDto;
import com.homegravity.Odi.domain.payment.dto.request.PaymentRequestDto;
import com.homegravity.Odi.domain.payment.dto.request.PaymentSuccessRequestDto;
import com.homegravity.Odi.domain.payment.dto.response.PaymentConfirmationResponseDto;
import com.homegravity.Odi.domain.payment.dto.response.PaymentHistoryResponseDto;
import com.homegravity.Odi.domain.payment.dto.response.PaymentResponseDto;
import com.homegravity.Odi.domain.payment.dto.toss.PaymentConfirmation;
import com.homegravity.Odi.domain.payment.dto.toss.PaymentConfirmation.PaymentDetails;
import com.homegravity.Odi.domain.payment.dto.toss.PaymentConfirmation.PaymentFailure;
import com.homegravity.Odi.domain.payment.dto.toss.PSPConfirmationResponseDto;
import com.homegravity.Odi.domain.payment.dto.toss.PaymentError;
import com.homegravity.Odi.domain.payment.dto.toss.exception.PSPConfirmationException;
import com.homegravity.Odi.domain.payment.entity.Payment;
import com.homegravity.Odi.domain.payment.entity.PaymentHistory;
import com.homegravity.Odi.domain.payment.entity.PaymentState;
import com.homegravity.Odi.domain.payment.repository.PaymentHistoryRepository;
import com.homegravity.Odi.domain.payment.repository.PaymentRepository;
import com.homegravity.Odi.global.response.error.ErrorCode;
import com.homegravity.Odi.global.response.error.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;

    private final WebClient tossPaymentWebClient;

    private final PointService pointService;

    // 토스 결제 요청: 토스 PSP로 결제 요청 전 결제 서버에 등록
    public PaymentResponseDto requestTossPayment(Member member, PaymentRequestDto requestDto) {

        Payment payment = paymentRepository.save(Payment.createNewPayment(requestDto.getPayType(), requestDto.getAmount(), requestDto.getOrderName(), member, requestDto.toString()));
        return PaymentResponseDto.from(payment);
    }

    // 결제 데이터 검증
    public PaymentConfirmationResponseDto confirm(PaymentSuccessRequestDto requestDto) {

        // request가 결제 승인 대상인지 확인 후 결제 진행 상태 업데이트
        Payment payment = updatePaymentStateToExecuting(requestDto);

        // 토스에 구매자의 결제 응답 검증 요청
        PaymentConfirmation paymentConfirm = requestPaymentConfirm(requestDto);

        PaymentConfirmationResponseDto result = null;

        switch (getPaymentState(paymentConfirm)) {
            case SUCCESS -> result = updatePaymentStateToSuccess(payment, paymentConfirm.getPaymentDetails());
            case FAILURE -> result = updatePaymentStateToFailure(payment, paymentConfirm.getFailure());
            case UNKNOWN -> result = updatePaymentStateToUnknown(payment);
        }

        return result;
    }

    // request가 결제 승인 대상인지 확인 후 결제 진행 상태 업데이트
    public Payment updatePaymentStateToExecuting(PaymentSuccessRequestDto requestDto) {

        Payment payment = verifyPayment(requestDto.getOrderId());
        payment.updatePaymentState(PaymentState.EXECUTING);
        payment.updatePaymentKey(requestDto.getPaymentKey());

        return payment;
    }

    // DB에 존재하는 정보이며 승인할 수 있는 상태인지 확인.
    public Payment verifyPayment(String orderId) {
        Payment payment = paymentRepository.findByOrderIdAndDeletedAtIsNull(orderId).orElseThrow(() -> new BusinessException(ErrorCode.ORDER_ID_NOT_EXIST, "존재하지 않는 결제 정보입니다."));

        switch (payment.getPaymentState()) {
            // NOT_STARTED, UNKNOWN, EXECUTING 일 때만 다음 단계 가능
            case SUCCESS -> throw new BusinessException(ErrorCode.PAYMENT_ALREADY_SUCCESS, "이미 처리에 성공한 결제입니다.");
            case FAILURE -> throw new BusinessException(ErrorCode.PAYMENT_ALREADY_FAILURE, "이미 처리에 실패한 결제입니다.");
        }
        return payment;
    }

    // 토스에 결제 검증 및 승인 요청
    public PaymentConfirmation requestPaymentConfirm(PaymentSuccessRequestDto requestDto) {

        return tossPaymentWebClient.post()
                .header("Idempotency-Key", requestDto.getOrderId())
                .body(Mono.just(requestDto), PaymentRequestDto.class)
                .retrieve()
                .onStatus(HttpStatusCode::isError,
                        clientResponse -> clientResponse.bodyToMono(PaymentFailDto.class)
                                .flatMap(failure -> {
                                    PaymentError error = PaymentError.get(failure.getCode());
                                    return Mono.error(new PSPConfirmationException(
                                            error.name(),
                                            error.getDescription(),
                                            error.isSuccess(),
                                            error.isFailure(),
                                            error.isUnknown(),
                                            error.isRetryableError()
                                    ));
                                })
                )
                .bodyToMono(PSPConfirmationResponseDto.class)
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(1))
                        .jitter(0.1)
                        .filter(exception ->
                                (exception instanceof PSPConfirmationException &&
                                        ((PSPConfirmationException) exception).isRetryableError())
                                        || exception instanceof TimeoutException
                        )
                        .onRetryExhaustedThrow(((retryBackoffSpec, retrySignal) -> retrySignal.failure())))
                .map(PaymentConfirmation::fromResponseDto)
                .block();
    }

    // 결제 승인 결과 state 조회
    public PaymentState getPaymentState(PaymentConfirmation paymentConfirmation) {

        if (paymentConfirmation.getIsSuccess()) {
            return PaymentState.SUCCESS;
        } else if (paymentConfirmation.getIsFailure()) {
            return PaymentState.FAILURE;
        } else if (paymentConfirmation.getIsUnknown()) {
            return PaymentState.UNKNOWN;
        } else {
            throw new BusinessException(ErrorCode.PAYMENT_INVALID, ErrorCode.PAYMENT_INVALID.getMessage());
        }
    }

    @Transactional
    public PaymentConfirmationResponseDto updatePaymentStateToSuccess(Payment payment, PaymentDetails paymentDetails) {

        paymentHistoryRepository.save(PaymentHistory.of(payment, payment.getPaymentState(), PaymentState.SUCCESS, "결제 승인 완료"));
        payment.updatePaymentState(PaymentState.SUCCESS);
        payment.updateApprovedAt(paymentDetails.getApprovedAt());

        // 결제정보 업데이트
        pointService.chargePoint(payment);

        return PaymentConfirmationResponseDto.of(PaymentState.SUCCESS);
    }

    @Transactional
    public PaymentConfirmationResponseDto updatePaymentStateToFailure(Payment payment, PaymentFailure failure) {

        paymentHistoryRepository.save(PaymentHistory.of(payment, payment.getPaymentState(), PaymentState.FAILURE, failure.getMessage()));
        payment.updatePaymentState(PaymentState.FAILURE);

        return PaymentConfirmationResponseDto.of(PaymentState.FAILURE, failure);
    }

    @Transactional
    public PaymentConfirmationResponseDto updatePaymentStateToUnknown(Payment payment) {

        paymentHistoryRepository.save(PaymentHistory.of(payment, payment.getPaymentState(), PaymentState.UNKNOWN, "이유 알 수 없음"));
        payment.updatePaymentState(PaymentState.UNKNOWN);
        payment.incrementFailedCount();

        return PaymentConfirmationResponseDto.of(PaymentState.UNKNOWN);
    }

    // 결제 실패 정보 업데이트
    public PaymentConfirmationResponseDto failTossPayment(PaymentFailDto requestDto) {

        // 존재하는 결제 요청이었는지 확인
        Payment payment = verifyPayment(requestDto.getOrderId());
        return updatePaymentStateToFailure(payment, PaymentFailure.fromPaymentFailDto(requestDto));
    }

    // 결제 내역 조회 - 최신순
    public Slice<PaymentHistoryResponseDto> getPaymentHistory(Member member, Pageable pageable) {

        Pageable sortPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Order.desc("modifiedAt")));
        return paymentRepository.findAllByCustomer(member, sortPageable).map(PaymentHistoryResponseDto::from);
    }
}
