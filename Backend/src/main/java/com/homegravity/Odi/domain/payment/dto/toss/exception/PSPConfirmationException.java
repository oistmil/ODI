package com.homegravity.Odi.domain.payment.dto.toss.exception;

import com.homegravity.Odi.domain.payment.dto.toss.PaymentStatus;
import lombok.Getter;

public class PSPConfirmationException  extends RuntimeException {

    @Getter
    private final String errorCode;
    private final String errorMessage;
    private final boolean isSuccess;
    private final boolean isFailure;
    private final boolean isUnknown;
    private final boolean isRetryableError;

    public PSPConfirmationException(String errorCode, String errorMessage, boolean isSuccess, boolean isFailure, boolean isUnknown, boolean isRetryableError) {
        this(errorCode, errorMessage, isSuccess, isFailure, isUnknown, isRetryableError, null);
    }

    public PSPConfirmationException(String errorCode, String errorMessage, boolean isSuccess, boolean isFailure, boolean isUnknown, boolean isRetryableError, Throwable cause) {
        super(errorMessage, cause);
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.isSuccess = isSuccess;
        this.isFailure = isFailure;
        this.isUnknown = isUnknown;
        this.isRetryableError = isRetryableError;

        if (!(isSuccess || isFailure || isUnknown)) {
            throw new IllegalArgumentException("올바르지 않은 결제 상태 입니다.");
        }
    }

    public PaymentStatus paymentStatus() {
        if (isSuccess) {
            return PaymentStatus.SUCCESS;
        } else if (isFailure) {
            return PaymentStatus.FAILURE;
        } else if (isUnknown) {
            return PaymentStatus.UNKNOWN;
        } else {
            throw new IllegalArgumentException("올바르지 않은 결제 상태 입니다.");
        }
    }

    @Override
    public String getMessage() {
        return errorMessage;
    }

    public boolean isSuccess() {
        return isSuccess;
    }

    public boolean isRetryableError() {
        return isRetryableError;
    }
}