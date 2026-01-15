package com.astro.mood.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.Getter;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting 설정
 * Bucket4j를 사용한 토큰 버킷 알고리즘 구현
 */
@Configuration
@Getter
public class RateLimitConfig {

    /**
     * Rate Limit 정책 정의
     * 각 API 카테고리별로 다른 제한을 적용
     */
    public enum RateLimitType {
        // 인증 관련 API - 브루트포스 공격 방지
        AUTH_LOGIN(15, Duration.ofMinutes(1)), // 로그인: 1분에 15회
        AUTH_REGISTER(10, Duration.ofMinutes(1)), // 회원가입: 1분에 10회
        AUTH_TOKEN_REFRESH(30, Duration.ofMinutes(1)), // 토큰 갱신: 1분에 30회

        // 일기 작성 API - 스팸 방지
        DIARY_CREATE(20, Duration.ofMinutes(1)), // 일기 작성: 1분에 20회
        DIARY_UPDATE(20, Duration.ofMinutes(1)), // 일기 수정: 1분에 20회
        DIARY_READ(500, Duration.ofMinutes(1)), // 일기 조회: 1분에 500회

        // 파일 업로드 API - 리소스 남용 방지
        FILE_UPLOAD(30, Duration.ofMinutes(1)), // 파일 업로드: 1분에 30회
        PROFILE_UPDATE(10, Duration.ofMinutes(1)), // 프로필 수정: 1분에 10회

        // 일반 API - 기본 제한
        GENERAL_API(200, Duration.ofMinutes(1)), // 일반 API: 1분에 200회

        // 글로벌 제한 - 전체 요청
        GLOBAL(600, Duration.ofMinutes(1)); // 전체: 1분에 600회

        private final long capacity; // 버킷 용량
        private final Duration refillDuration; // 리필 주기

        RateLimitType(long capacity, Duration refillDuration) {
            this.capacity = capacity;
            this.refillDuration = refillDuration;
        }

        public long getCapacity() {
            return capacity;
        }

        public Duration getRefillDuration() {
            return refillDuration;
        }
    }

    /**
     * IP별 버킷 저장소 (인메모리)
     * Key: "IP:RateLimitType", Value: Bucket
     */
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    /**
     * 버킷 생성 또는 조회
     * 
     * @param key  IP 주소 또는 사용자 식별자
     * @param type Rate Limit 타입
     * @return Bucket 인스턴스
     */
    public Bucket resolveBucket(String key, RateLimitType type) {
        String cacheKey = key + ":" + type.name();
        return cache.computeIfAbsent(cacheKey, k -> createBucket(type));
    }

    /**
     * 새로운 버킷 생성
     * 
     * @param type Rate Limit 타입
     * @return 새로운 Bucket 인스턴스
     */
    private Bucket createBucket(RateLimitType type) {
        // Bandwidth: 용량과 리필 전략 정의 (Bucket4j 8.x API)
        Bandwidth limit = Bandwidth.builder()
                .capacity(type.getCapacity())
                .refillIntervally(type.getCapacity(), type.getRefillDuration())
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * 특정 키의 버킷 제거 (테스트 또는 관리 목적)
     * 
     * @param key 제거할 키
     */
    public void removeBucket(String key, RateLimitType type) {
        String cacheKey = key + ":" + type.name();
        cache.remove(cacheKey);
    }

    /**
     * 모든 버킷 초기화 (관리 목적)
     */
    public void clearAllBuckets() {
        cache.clear();
    }

    /**
     * 현재 캐시된 버킷 수 반환 (모니터링 목적)
     */
    public int getBucketCount() {
        return cache.size();
    }
}
