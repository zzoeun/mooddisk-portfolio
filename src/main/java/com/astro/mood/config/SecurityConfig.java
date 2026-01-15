package com.astro.mood.config;

import com.astro.mood.security.jwt.JWTFilter;
import com.astro.mood.security.jwt.JWTUtil;
import com.astro.mood.security.filter.SecurityThreatFilter;
import com.astro.mood.security.filter.RateLimitFilter;
import com.astro.mood.security.filter.XssFilter;
import com.astro.mood.service.auth.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

import java.util.Arrays;
import java.util.List;

// 빌드
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        @Autowired
        private Environment environment;
        private final AuthenticationConfiguration authenticationConfiguration;
        private final JWTUtil jwtUtil;
        private final CustomUserDetailsService customUserDetailsService; // UserDetailsService 추가
        private final SecurityThreatFilter securityThreatFilter; // 보안 위협 필터
        private final RateLimitFilter rateLimitFilter; // Rate Limiting 필터
        private final XssFilter xssFilter; // XSS 방어 필터
        private final ObjectMapper objectMapper; // JSON 직렬화용

        @Bean
        public AuthenticationManager authenticationManager() throws Exception {
                return authenticationConfiguration.getAuthenticationManager();
        }

        @Bean
        @SuppressWarnings("deprecation")
        public RoleHierarchy roleHierarchy() {
                RoleHierarchyImpl roleHierarchy = new RoleHierarchyImpl();
                roleHierarchy.setHierarchy("ROLE_ADMIN > ROLE_USER");
                return roleHierarchy;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .headers(headers -> headers
                                                .frameOptions(frameOptions -> frameOptions.deny()) // 클릭재킹 방지
                                                .contentTypeOptions(contentTypeOptions -> {
                                                }) // MIME 타입 스니핑 방지
                                                .httpStrictTransportSecurity(hstsConfig -> hstsConfig
                                                                .maxAgeInSeconds(31536000) // 1년
                                                                .includeSubDomains(true)
                                                                .preload(true))
                                                .referrerPolicy(referrerPolicy -> referrerPolicy
                                                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                                                .addHeaderWriter((request, response) -> {
                                                        // XSS 방지
                                                        response.setHeader("X-XSS-Protection", "1; mode=block");
                                                        // 콘텐츠 보안 정책
                                                        if (isProductionProfile()) {
                                                                response.setHeader("Content-Security-Policy",
                                                                                "default-src 'self'; " +
                                                                                                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://t1.daumcdn.net https://cdn.jsdelivr.net; "
                                                                                                +
                                                                                                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                                                                                                +
                                                                                                "img-src 'self' data: https:; "
                                                                                                +
                                                                                                "font-src 'self' https://cdn.jsdelivr.net; "
                                                                                                +
                                                                                                "connect-src 'self' https://api.mooddisk.com; "
                                                                                                +
                                                                                                "frame-src 'none'; " +
                                                                                                "object-src 'none'; " +
                                                                                                "base-uri 'self'; " +
                                                                                                "form-action 'self'");
                                                        } else {
                                                                response.setHeader("Content-Security-Policy",
                                                                                "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; "
                                                                                                +
                                                                                                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; "
                                                                                                +
                                                                                                "style-src 'self' 'unsafe-inline' https:; "
                                                                                                +
                                                                                                "img-src 'self' data: https:; "
                                                                                                +
                                                                                                "font-src 'self' https:; "
                                                                                                +
                                                                                                "connect-src 'self' http: https:; "
                                                                                                +
                                                                                                "frame-src 'self' https:; "
                                                                                                +
                                                                                                "object-src 'none'; " +
                                                                                                "base-uri 'self'; " +
                                                                                                "form-action 'self'");
                                                        }
                                                        // 권한 정책
                                                        response.setHeader("Permissions-Policy",
                                                                        "geolocation=(), " +
                                                                                        "microphone=(), " +
                                                                                        "camera=(), " +
                                                                                        "payment=(), " +
                                                                                        "usb=(), " +
                                                                                        "magnetometer=(), " +
                                                                                        "gyroscope=(), " +
                                                                                        "speaker=(), " +
                                                                                        "vibrate=(), " +
                                                                                        "fullscreen=(self), " +
                                                                                        "sync-xhr=()");
                                                        // 서버 정보 숨김
                                                        response.setHeader("Server", "mooddisk");
                                                        // X-Powered-By 헤더 제거
                                                        response.setHeader("X-Powered-By", "");
                                                }))
                                .formLogin(AbstractHttpConfigurer::disable)// 폼 로그인 비활성화
                                .csrf(AbstractHttpConfigurer::disable) // CSRF 보호 비활성화
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .httpBasic(AbstractHttpConfigurer::disable) // HTTP Basic 인증 비활성화
                                .rememberMe(AbstractHttpConfigurer::disable)
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/", "/resources/static/**").permitAll() // 루트 경로 허용
                                                .requestMatchers("/api/auth/social/**").permitAll() // Allow new social
                                                                                                    // login endpoints
                                                .requestMatchers("/api/auth/logout").hasAuthority("ROLE_USER") // 로그아웃은
                                                                                                               // 인증된
                                                                                                               // 사용자만
                                                .requestMatchers("/api/auth/refresh").hasAuthority("ROLE_USER") // 토큰
                                                                                                                // 갱신은
                                                                                                                // 인증된
                                                                                                                // 사용자만
                                                .requestMatchers("/login/oauth2/code/**").permitAll() // OAuth2 콜백 URL
                                                                                                      // 허용
                                                .requestMatchers("/swagger-resources/**", "/swagger-ui/**",
                                                                "/v3/api-docs/**")
                                                .permitAll() // Swagger 관련 경로 허용
                                                .requestMatchers("/test/**").hasAuthority("ROLE_USER")
                                                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN") // 어드민 권한
                                                                                                             // 체크
                                                .requestMatchers(
                                                                "/api/main", "/api/diary/**",
                                                                "/api/emotions/**",
                                                                "/api/user/**")
                                                .hasAuthority("ROLE_USER")
                                                .anyRequest().permitAll())
                                .sessionManagement(sessionManagement -> sessionManagement
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)// 세션 상태 비활성화
                                )
                                // 필터 체인 순서:
                                // 1. SecurityThreatFilter (보안 위협 체크)
                                // 2. XssFilter (XSS 공격 방어)
                                // 3. RateLimitFilter (속도 제한)
                                // 4. JWTFilter (인증)
                                .addFilterBefore(securityThreatFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(xssFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(new JWTFilter(jwtUtil, customUserDetailsService, objectMapper),
                                                UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        // 프론트 엔드에서 백엔드로 요청보낼 때, cors 오류를 방지 하기 위함.
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                if (isProductionProfile()) {
                        // 프로덕션 환경: 엄격한 CORS 정책
                        configuration.setAllowedOrigins(List.of(
                                        "https://mooddisk.com",
                                        "https://www.mooddisk.com"));

                        System.out.println("Production CORS policy applied - restricted origins only");
                } else {
                        // 개발 환경: 개발을 위한 관대한 CORS 정책
                        configuration.setAllowedOrigins(List.of(
                                        "http://localhost:3000",
                                        "http://localhost:8080",
                                        "https://mooddisk.com",
                                        "https://www.mooddisk.com",
                                        "https://api.mooddisk.com"));

                        System.out.println("Development CORS policy applied - permissive origins");
                }

                configuration.setAllowCredentials(true);
                configuration.setAllowedHeaders(
                                List.of("Content-Type", "X-Requested-With", "Accept", "Origin", "Authorization"));
                configuration.setAllowedMethods(Arrays.asList("GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"));

                if (isProductionProfile()) {
                        // 프로덕션에서는 더 짧은 캐시 시간
                        configuration.setMaxAge(1800L); // 30분
                } else {
                        // 개발 환경에서는 더 긴 캐시 시간
                        configuration.setMaxAge(3600L); // 1시간
                }

                // 배포 환경을 위한 추가 설정 (프로덕션에서만)
                if (isProductionProfile()) {
                        configuration.addAllowedHeader("X-Forwarded-For");
                        configuration.addAllowedHeader("X-Real-IP");
                        configuration.addAllowedHeader("X-Forwarded-Proto");
                }

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        /**
         * 현재 프로파일이 프로덕션인지 확인
         */
        private boolean isProductionProfile() {
                String[] activeProfiles = environment.getActiveProfiles();
                for (String profile : activeProfiles) {
                        if ("prod".equals(profile) || "production".equals(profile)) {
                                return true;
                        }
                }
                return false;
        }
}