package com.ordersphere.shared.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
    private static final Logger LOG = LoggerFactory.getLogger(ApiExceptionHandler.class);
    @ExceptionHandler(ApiException.class)
    ProblemDetail business(ApiException ex) { return ProblemDetail.forStatusAndDetail(ex.status(), ex.getMessage()); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail constraint(DataIntegrityViolationException ex) { return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Resource conflicts with a uniqueness or integrity constraint"); }
    @ExceptionHandler(PessimisticLockingFailureException.class)
    ProblemDetail contention(PessimisticLockingFailureException ex) { return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Concurrent update; retry the operation after checking current state"); }
    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail invalid(IllegalArgumentException ex) { return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request value"); }
    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail credentials(AuthenticationException ex) { return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Invalid credentials"); }
    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail denied(AccessDeniedException ex) { return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Access denied"); }
    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception ex) {
        LOG.error("Unhandled request failure type={}", ex.getClass().getSimpleName());
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error");
    }
}
