package com.astro.mood.security.jwt;

import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.service.auth.CustomUserDetailsService;
import com.astro.mood.web.dto.auth.KakaoUserDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@RequiredArgsConstructor
@Component
public class JWTUtil {
    private SecretKey secretKey;
    @Value("${jwt.secret}")
    private String secret;
    @Value("${jwt.expiration_time}")
    private long accessTokenExpTime;
    private final CustomUserDetailsService customUserDetailsService;

    @Value("${KAKAO_REST_API_KEY}")
    private String kakaoKey;
    @Value("${KAKAO_SECRET_KEY}")
    private String kakaoSecretKey;
    @Value("${GOOGLE_ID_KEY}")
    private String googleClientId;
    @Value("${GOOGLE_SECRET_KEY}")
    private String googleClientSecret;

    @PostConstruct
    public void setUp() {
        this.secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),
                SignatureAlgorithm.HS256.getJcaName());
    }

    public Integer getLoginIdx(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("loginIdx", Integer.class);
    }

    public String getRole(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("role", String.class);
    }

    public String getNickname(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("nickname", String.class);
    }

    public Boolean isExpired(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims != null && claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String createJwt(Authentication loginInfo) {
        if (!(loginInfo.getPrincipal() instanceof CustomUserDetails)) {
            throw new IllegalArgumentException("Invalid authentication principal");
        }

        CustomUserDetails user = (CustomUserDetails) loginInfo.getPrincipal();
        Collection<? extends GrantedAuthority> authorities = user.getAuthorities();

        if (authorities.isEmpty()) {
            throw new IllegalStateException("User has no authorities");
        }

        String role = authorities.iterator().next().getAuthority();

        return Jwts.builder()
                .claim("loginIdx", user.getUserIdx())
                .claim("nickname", user.getNickname())
                .claim("email", user.getEmail())
                .claim("profileImage", user.getProfileImage())
                .claim("role", role)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpTime))
                .signWith(secretKey)
                .compact();
    }

    public Map<String, Object> verifyIdToken(String idToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String googleVerifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    googleVerifyUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> body = response.getBody();

            if (body == null || body.isEmpty()) {
                return new HashMap<>();
            }

            if (!body.containsKey("sub")) {
                return new HashMap<>();
            }

            return body;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            return new HashMap<>();
        } catch (org.springframework.web.client.RestClientException e) {
            return new HashMap<>();
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public Map<String, Object> verifyGoogleCode(String code, String redirectUri) throws IOException {
        if (code == null || code.trim().isEmpty()) {
            return new HashMap<>();
        }

        RestTemplate restTemplate = new RestTemplate();
        String googleTokenUrl = "https://oauth2.googleapis.com/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = String.format(
                "grant_type=authorization_code&client_id=%s&client_secret=%s&redirect_uri=%s&code=%s",
                googleClientId, googleClientSecret, redirectUri, code);

        HttpEntity<String> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                googleTokenUrl,
                HttpMethod.POST,
                requestEntity,
                new ParameterizedTypeReference<Map<String, Object>>() {
                });

        Map<String, Object> tokenResponse = response.getBody();
        if (tokenResponse == null || !tokenResponse.containsKey("id_token")) {
            return new HashMap<>();
        }

        String idToken = tokenResponse.get("id_token").toString();
        return verifyIdToken(idToken);
    }

    public Map<String, Object> verifyCode(String code, String redirectUri) throws IOException {
        if (code == null || code.trim().isEmpty()) {
            return new HashMap<>();
        }

        RestTemplate restTemplate = new RestTemplate();
        String kakaoVerifyUrl = "https://kauth.kakao.com/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = String.format(
                "grant_type=authorization_code&client_id=%s&redirect_uri=%s&client_secret=%s&code=%s",
                kakaoKey, redirectUri, kakaoSecretKey, code);

        HttpEntity<String> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<KakaoUserDto.OAuthToken> response = restTemplate.exchange(
                kakaoVerifyUrl,
                HttpMethod.POST,
                requestEntity,
                KakaoUserDto.OAuthToken.class);

        KakaoUserDto.OAuthToken token = response.getBody();
        if (token == null || token.getAccess_token() == null) {
            return new HashMap<>();
        }

        return kakaoUserInfo(token.getAccess_token());
    }

    public Map<String, Object> verifyAppleIdToken(String identityToken) {
        try {
            // Apple ID Token은 JWT 형식이므로 직접 파싱
            String[] chunks = identityToken.split("\\.");
            if (chunks.length != 3) {
                return new HashMap<>();
            }

            // JWT 페이로드 디코딩
            String payload = new String(Base64.getUrlDecoder().decode(chunks[1]));

            // JSON 파싱
            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> payloadMap = mapper.readValue(payload, Map.class);

            // Apple ID Token 검증 (간단한 검증)
            String iss = (String) payloadMap.get("iss");
            Long exp = ((Number) payloadMap.get("exp")).longValue();

            // 발급자 검증 (Apple)
            if (!"https://appleid.apple.com".equals(iss)) {
                return new HashMap<>();
            }

            // 만료 시간 검증
            if (exp < System.currentTimeMillis() / 1000) {
                return new HashMap<>();
            }

            // 사용자 정보 추출
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("sub", payloadMap.get("sub")); // Apple 사용자 ID
            userInfo.put("email", payloadMap.get("email"));
            userInfo.put("email_verified", payloadMap.get("email_verified"));
            userInfo.put("provider", "APPLE");

            return userInfo;
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public Map<String, Object> verifyKakaoAccessToken(String accessToken) {
        try {
            // 카카오 액세스 토큰으로 사용자 정보 조회
            String url = "https://kapi.kakao.com/v2/user/me";

            // HTTP 요청 생성
            java.net.URL kakaoUrl = new java.net.URL(url);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) kakaoUrl.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Authorization", "Bearer " + accessToken);
            connection.setRequestProperty("Content-Type", "application/json");

            // 응답 읽기
            int responseCode = connection.getResponseCode();
            if (responseCode != 200) {
                return new HashMap<>();
            }

            java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(connection.getInputStream()));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            // JSON 파싱
            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = mapper.readValue(response.toString(), Map.class);

            // 사용자 정보 추출 및 변환
            Map<String, Object> result = new HashMap<>();
            result.put("sub", userInfo.get("id").toString()); // 카카오 사용자 ID
            result.put("email",
                    userInfo.get("kakao_account") != null
                            ? ((Map<?, ?>) userInfo.get("kakao_account")).get("email")
                            : null);
            result.put("name", userInfo.get("kakao_account") != null &&
                    ((Map<?, ?>) userInfo.get("kakao_account")).get("profile") != null
                            ? ((Map<?, ?>) ((Map<?, ?>) userInfo.get("kakao_account"))
                                    .get("profile")).get("nickname")
                            : null);
            result.put("profile_image", userInfo.get("kakao_account") != null &&
                    ((Map<?, ?>) userInfo.get("kakao_account")).get("profile") != null
                            ? ((Map<?, ?>) ((Map<?, ?>) userInfo.get("kakao_account"))
                                    .get("profile")).get("profile_image_url")
                            : null);
            result.put("provider", "KAKAO");

            return result;
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public Map<String, Object> verifyGoogleAccessToken(String accessToken) {
        try {
            // Google 액세스 토큰으로 사용자 정보 조회
            String url = "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken;

            // HTTP 요청 생성
            java.net.URL googleUrl = new java.net.URL(url);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) googleUrl.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Content-Type", "application/json");

            // 응답 읽기
            int responseCode = connection.getResponseCode();
            if (responseCode != 200) {
                return new HashMap<>();
            }

            java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(connection.getInputStream()));
            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            // JSON 파싱
            ObjectMapper mapper = new ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = mapper.readValue(response.toString(), Map.class);

            // 사용자 정보 추출 및 변환
            Map<String, Object> result = new HashMap<>();
            result.put("sub", userInfo.get("id")); // Google 사용자 ID
            result.put("email", userInfo.get("email"));
            result.put("name", userInfo.get("name"));
            result.put("profile_image", userInfo.get("picture"));
            result.put("provider", "GOOGLE");

            return result;
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public Map<String, Object> kakaoUserInfo(String accessToken) {
        if (accessToken == null || accessToken.trim().isEmpty()) {
            return new HashMap<>();
        }

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        HttpEntity<String> kakaoProfileRequest = new HttpEntity<>(headers);

        ResponseEntity<KakaoUserDto.KakaoProfile> response = restTemplate.exchange(
                "https://kapi.kakao.com/v2/user/me",
                HttpMethod.GET,
                kakaoProfileRequest,
                KakaoUserDto.KakaoProfile.class);

        Map<String, Object> userInfo = new HashMap<>();
        KakaoUserDto.KakaoProfile profile = response.getBody();
        if (profile != null) {
            KakaoUserDto.KakaoProfile.KakaoAccount account = profile.getKakaoAccount();
            KakaoUserDto.KakaoProfile.Properties properties = profile.getProperties();

            userInfo.put("email", account != null ? account.getEmail() : null);
            userInfo.put("sub", String.valueOf(profile.getId())); // Kakao ID를 문자열로 변환
            userInfo.put("picture", properties != null ? properties.getProfile_image() : null);
            userInfo.put("name", properties != null ? properties.getNickname() : null);
        }

        return userInfo;
    }

    public boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims != null && claims.getExpiration() != null && claims.getExpiration().after(new Date());
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            return false;
        } catch (ExpiredJwtException e) {
            return false;
        } catch (UnsupportedJwtException e) {
            return false;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public String createRefreshToken(Integer loginId) {
        return Jwts.builder()
                .claim("loginIdx", loginId)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpTime * 30))
                .signWith(secretKey)
                .compact();
    }

    public Authentication getAuthentication(String token) {
        Integer userIdx = getLoginIdx(token);
        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUserIdx(userIdx);
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }
}
