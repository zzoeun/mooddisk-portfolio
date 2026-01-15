#!/usr/bin/env node

/**
 * IP 주소 변경 자동화 스크립트 (Node.js 버전)
 * 사용법: node scripts/update-ip.js <새로운_IP_주소>
 */

const fs = require("fs");
const path = require("path");

// 설정 파일들과 해당 파일에서 변경할 패턴들
const configFiles = [
  {
    path: "eas.json",
    patterns: [
      {
        search: /"EXPO_PUBLIC_API_URL": "http:\/\/\d+\.\d+\.\d+\.\d+:8080"/g,
        replace: '"EXPO_PUBLIC_API_URL": "http://{IP}:8080"',
      },
    ],
  },
  {
    path: "src/main/mobile/eas.json",
    patterns: [
      {
        search: /"EXPO_PUBLIC_API_URL": "http:\/\/\d+\.\d+\.\d+\.\d+:8080"/g,
        replace: '"EXPO_PUBLIC_API_URL": "http://{IP}:8080"',
      },
    ],
  },
  {
    path: "src/main/mobile/app.config.ts",
    patterns: [
      {
        search: /"http:\/\/\d+\.\d+\.\d+\.\d+:8080"/g,
        replace: '"http://{IP}:8080"',
      },
    ],
  },
];

function updateIP(newIP) {
  console.log(`🔄 IP 주소를 ${newIP}로 변경 중...\n`);

  let updatedFiles = 0;

  configFiles.forEach((config) => {
    const filePath = path.join(process.cwd(), config.path);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  파일을 찾을 수 없습니다: ${config.path}`);
      return;
    }

    try {
      let content = fs.readFileSync(filePath, "utf8");
      let hasChanges = false;

      config.patterns.forEach((pattern) => {
        const newContent = content.replace(
          pattern.search,
          pattern.replace.replace("{IP}", newIP)
        );
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ ${config.path} 업데이트 완료`);
        updatedFiles++;
      } else {
        console.log(`⏭️  ${config.path} 변경사항 없음`);
      }
    } catch (error) {
      console.error(`❌ ${config.path} 업데이트 실패:`, error.message);
    }
  });

  console.log(`\n🎉 총 ${updatedFiles}개 파일이 업데이트되었습니다!`);
  console.log("\n🚀 다음 단계:");
  console.log(
    "   1. 모바일 앱 재시작: cd src/main/mobile && npx expo start --clear"
  );
  console.log("   2. 프론트엔드 재시작: cd src/main/frontend && npm start");
}

// 명령행 인수 확인
const newIP = process.argv[2];

if (!newIP) {
  console.log("사용법: node scripts/update-ip.js <새로운_IP_주소>");
  console.log("예시: node scripts/update-ip.js <IP_ADDRESS>");
  process.exit(1);
}

// IP 주소 형식 검증
const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
if (!ipRegex.test(newIP)) {
  console.error("❌ 올바른 IP 주소 형식이 아닙니다. (예: <IP_ADDRESS>)");
  process.exit(1);
}

updateIP(newIP);
