package com.astro.mood;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableJpaAuditing
public class MoodApplication {
	public static void main(String[] args) {
		// 시간대를 한국 시간으로 설정
		System.setProperty("user.timezone", "Asia/Seoul");
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Seoul"));

		// 로컬에서만 .env 로드
		if (isLocalEnvironment()) {
			Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

			// SPRING_PROFILES_ACTIVE를 먼저 설정 (다른 설정들이 이를 참조할 수 있음)
			String springProfilesActive = dotenv.get("SPRING_PROFILES_ACTIVE");
			if (springProfilesActive != null && !springProfilesActive.isEmpty()) {
				System.setProperty("spring.profiles.active", springProfilesActive);
			}

			// 환경 변수를 시스템 프로퍼티로 설정
			System.setProperty("GOOGLE_CLIENT_ID", dotenv.get("GOOGLE_CLIENT_ID", ""));
			System.setProperty("GOOGLE_SECRET_KEY", dotenv.get("GOOGLE_SECRET_KEY", ""));
			System.setProperty("KAKAO_REST_API_KEY", dotenv.get("KAKAO_REST_API_KEY", ""));
			System.setProperty("KAKAO_SECRET_KEY", dotenv.get("KAKAO_SECRET_KEY", ""));

			// DB 관련 환경 변수도 설정
			dotenv.entries().forEach(entry -> {
				String key = entry.getKey();
				if (key.startsWith("DB_")) {
					System.setProperty(key, entry.getValue());
				}
			});
		}

		SpringApplication.run(MoodApplication.class, args);
	}

	/**
	 * 로컬 환경인지 확인
	 * 프로덕션 프로파일(prod, production)이 아닌 경우 모두 로컬로 인식
	 * 이렇게 하면 dev 프로파일을 사용해도 .env 파일이 로드됨
	 */
	private static boolean isLocalEnvironment() {
		String env = System.getenv("SPRING_PROFILES_ACTIVE");
		if (env == null) {
			return true; // 프로파일이 없으면 로컬
		}
		// 프로덕션 프로파일만 제외하고 나머지는 모두 로컬로 인식
		return !env.equals("prod") && !env.equals("production");
	}
}