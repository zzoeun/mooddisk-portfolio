package com.astro.mood.service.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // Test Error
    TEST_ERROR(10000, HttpStatus.BAD_REQUEST, "테스트 에러입니다."),

    // 400 Bad Request
    INVALID_PARAMETER(40000, HttpStatus.BAD_REQUEST, "잘못된 요청 파라미터입니다."),
    MISSING_REQUIRED_PARAMETER(40001, HttpStatus.BAD_REQUEST, "필수 파라미터가 누락되었습니다."),
    INVALID_REQUEST_BODY(40002, HttpStatus.BAD_REQUEST, "잘못된 요청 본문입니다."),
    // 400 Bad Request - 사용자정보 수정
    INVALID_VALUE_EMAIL(40003, HttpStatus.BAD_REQUEST, "잘못된 이메일 형식입니다."),
    INVALID_VALUE_NICKNAME(40004, HttpStatus.BAD_REQUEST, "10자 이내의 닉네임을 설정해주세요."),
    INVALID_VALUE_PHONE(40005, HttpStatus.BAD_REQUEST, "전화번호는 11자로 설정되어야 합니다."),
    // S3 ERROR - 400
    S3_INVALID_VALUE_URL(40006, HttpStatus.BAD_REQUEST, "잘못된 URL 형식입니다"),
    S3_FILE_EXTENSION_NOT_FOUND(40007, HttpStatus.BAD_REQUEST, "확장자를 찾을 수 없습니다."),
    S3_UNSUPPORTED_FILE_TYPE(40008, HttpStatus.BAD_REQUEST, "[jpg, jpeg, png, gif]의 확장자만 사용 가능합니다."),
    LIKE_COMMENT_IS_REPORTED(40009, HttpStatus.BAD_REQUEST, "신고된 댓글에 좋아요 할 수 없습니다."),
    REPLY_COMMENT_IS_REPORTED(40010, HttpStatus.BAD_REQUEST, "신고된 댓글에 답글을 할 수 없습니다."),
    REPLY_COMMENT_IS_DELETED(40010, HttpStatus.BAD_REQUEST, "삭제된 댓글에 답글을 할 수 없습니다."),
    CANNOT_EDIT_REPORTED_COMMENT(40011, HttpStatus.BAD_REQUEST, "신고된 댓글은 수정 할 수 없습니다."),
    CANNOT_EDIT_DELETED_COMMENT(40012, HttpStatus.BAD_REQUEST, "삭제된 댓글은 수정 할 수 없습니다."),
    DELETED_COMMENT_REPORT_ERROR(40013, HttpStatus.BAD_REQUEST, "삭제된 댓글은 신고 할 수 없습니다."),
    ALREADY_REPORTED_COMMENT_ERROR(40014, HttpStatus.BAD_REQUEST, "이미 신고된 댓글입니다."),
    ALREADY_DELETED_COMMENT_ERROR(40014, HttpStatus.BAD_REQUEST, "이미 삭제된 댓글입니다."),
    BAD_WORD_FILTER_ERROR(40014, HttpStatus.BAD_REQUEST, "고운 말을 나눠주세요."),
    SELF_REPORT_ERROR(40015, HttpStatus.BAD_REQUEST, "본인의 댓글을 신고할 수 없습니다. 삭제를 진행해 주세요."),
    FILE_SIZE_EXCEEDED(40016, HttpStatus.BAD_REQUEST, "파일 크기가 허용된 최대 크기를 초과했습니다."),
    XSS_PATTERN_DETECTED(40017, HttpStatus.BAD_REQUEST, "요청에 허용되지 않은 스크립트 패턴이 포함되어 있습니다."),
    INVALID_INPUT_VALUE(40018, HttpStatus.BAD_REQUEST, "입력값에 허용되지 않은 패턴이 포함되어 있습니다."),

    // 401 Unauthorized
    UNAUTHORIZED(40100, HttpStatus.UNAUTHORIZED, "인증되지 않은 사용자입니다."),
    INVALID_TOKEN(40101, HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(40102, HttpStatus.UNAUTHORIZED, "만료된 토큰입니다."),

    // 403 Forbidden
    FORBIDDEN(40300, HttpStatus.FORBIDDEN, "권한이 없습니다."),
    WITHDRAW_FORBIDDEN(40301, HttpStatus.FORBIDDEN, "이미 탈퇴한 회원입니다."),
    UNAUTHORIZED_ACCESS(40302, HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // 404 Not Found
    NOT_FOUND_END_POINT(40400, HttpStatus.NOT_FOUND, "존재하지 않는 API입니다."),
    RESOURCE_NOT_FOUND(40401, HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),
    USER_NOT_FOUND(40402, HttpStatus.NOT_FOUND, "사용자 정보를 찾을 수 없습니다."),
    DIARY_NOT_FOUND(40403, HttpStatus.NOT_FOUND, "일기를 찾을 수 없습니다."),
    EMOTION_NOT_FOUND(40404, HttpStatus.NOT_FOUND, "감정을 찾을 수 없습니다."),
    S3_IMAGE_NOT_FOUND(40405, HttpStatus.NOT_FOUND, "이미지가 비어있거나 파일 이름이 없습니다."),

    // 409 Conflict - 일기 상태 관련 오류
    DIARY_ALREADY_RESTORED(40900, HttpStatus.CONFLICT, "이미 복원된 일기입니다."),
    DIARY_NOT_IN_TRASH(40901, HttpStatus.CONFLICT, "휴지통에 있지 않은 일기입니다."),
    DUPLICATE_DISPLAY_ORDER(40902, HttpStatus.CONFLICT, "이미 사용 중인 표시 순서입니다."),

    // 429 Too Many Requests - Rate Limiting
    TOO_MANY_REQUESTS(42900, HttpStatus.TOO_MANY_REQUESTS, "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요."),
    RATE_LIMIT_EXCEEDED(42901, HttpStatus.TOO_MANY_REQUESTS, "요청 제한을 초과했습니다."),

    // 500 Internal Server Error
    INTERNAL_SERVER_ERROR(50000, HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류입니다."),
    UNEXPECTED_ERROR(50001, HttpStatus.INTERNAL_SERVER_ERROR, "예상치 못한 오류가 발생했습니다."),
    // S3 ERROR - 500
    S3_UPLOAD_ERROR(50002, HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다."),
    S3_UPLOAD_IO_ERROR(50003, HttpStatus.BAD_REQUEST, "이미지 업로드 중 IO 예외가 발생했습니다."),
    S3_DELETE_ERROR(50004, HttpStatus.INTERNAL_SERVER_ERROR, "이미지 삭제에 실패했습니다."),
    S3_DELETE_UNEXPECTED_ERROR(50005, HttpStatus.INTERNAL_SERVER_ERROR, "이미지 삭제 중 알 수 없는 오류가 발생했습니다."),
    S3_URL_DECODING_ERROR(50006, HttpStatus.INTERNAL_SERVER_ERROR, "URL 디코딩에 실패했습니다."),
    KAKAO_PARSING_ERROR(50008, HttpStatus.INTERNAL_SERVER_ERROR, "카카오 로그인 중 에러가 발생했습니다."),
    FILE_UPLOAD_ERROR(50009, HttpStatus.INTERNAL_SERVER_ERROR, "파일 업로드에 실패했습니다."),
    CONTENT_PROCESSING_ERROR(50010, HttpStatus.INTERNAL_SERVER_ERROR, "컨텐츠 처리 중 오류가 발생했습니다."),
    INVALID_DATE_FORMAT(50011, HttpStatus.BAD_REQUEST, "잘못된 날짜 형식입니다.");

    private final Integer code;
    private final HttpStatus httpStatus;
    private final String message;
}