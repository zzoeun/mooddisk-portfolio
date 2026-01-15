package com.astro.mood.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtUtil_origin {
//
//    private final Key key;
//    private final long accessTokenExpTime;
//
//    public JwtUtil_origin(
//            @Value("${jwt.secret}") String secretKey,
//            @Value("${jwt.expiration_time}") long accessTokenExpTime
//    ) {
//        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
//        this.key = Keys.hmacShaKeyFor(keyBytes);
//        this.accessTokenExpTime = accessTokenExpTime;
//    }
//
//
//    /**
//     * Access Token 생성
//     * @param member
//     * @return Access Token String
//     */
//    public String createAccessToken(CustomUserInfoDto member) {
//        return createToken(member, accessTokenExpTime);
//    }
//
//
//    /**
//     * JWT 생성
//     * @param member
//     * @param expireTime
//     * @return JWT String
//     */
//    private String createToken(CustomUserInfoDto member, long expireTime) {
//        Claims claims = Jwts.claims();
//        claims.put("userIdx", member.getUserIdx());
//        claims.put("nickname", member.getNickname());
//        claims.put("role",  member.getAuthorities());
//
//        ZonedDateTime now = ZonedDateTime.now();
//        ZonedDateTime tokenValidity = now.plusSeconds(expireTime);
//
//
//        return Jwts.builder()
//                .setClaims(claims)
//                .setIssuedAt(Date.from(now.toInstant()))
//                .setExpiration(Date.from(tokenValidity.toInstant()))
//                .signWith(key, SignatureAlgorithm.HS256)
//                .compact();
//    }
//
//
//    /**
//     * Token에서 User ID 추출
//     * @param token
//     * @return User ID
//     */
//    public Long getUserIdx(String token) {
//        return parseClaims(token).get("userIdx", Long.class);
//    }
//
//
//    /**
//     * JWT 검증
//     * @param token
//     * @return IsValidate
//     */
//    public boolean validateToken(String token) {
//        try {
//            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
//            return true;
//        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
//            log.info("Invalid JWT Token", e);
//        } catch (ExpiredJwtException e) {
//            log.info("Expired JWT Token", e);
//        } catch (UnsupportedJwtException e) {
//            log.info("Unsupported JWT Token", e);
//        } catch (IllegalArgumentException e) {
//            log.info("JWT claims string is empty.", e);
//        }
//        return false;
//    }
//
//
//    /**
//     * JWT Claims 추출
//     * @param accessToken
//     * @return JWT Claims
//     */
//    public Claims parseClaims(String accessToken) {
//        try {
//            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken).getBody();
//        } catch (ExpiredJwtException e) {
//            return e.getClaims();
//        }
//    }

}
