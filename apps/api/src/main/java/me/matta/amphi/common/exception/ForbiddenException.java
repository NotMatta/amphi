package me.matta.amphi.common.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenException extends ApiException {
    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, message);
    }
}
