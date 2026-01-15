#!/bin/bash

# IP 주소 변경 자동화 스크립트
# 사용법: ./scripts/update-ip.sh <IP_ADDRESS>

if [ $# -eq 0 ]; then
    echo "사용법: $0 <새로운_IP_주소>"
    echo "예시: $0 <IP_ADDRESS>"
    exit 1
fi

NEW_IP=$1
OLD_IP="<IP_ADDRESS>"  # 현재 IP (이전 IP로 변경시 사용)

echo "🔄 IP 주소를 $OLD_IP 에서 $NEW_IP 로 변경 중..."

# 1. 모바일 앱 설정 파일들 업데이트
echo "📱 모바일 앱 설정 업데이트..."
sed -i '' "s/$OLD_IP/$NEW_IP/g" src/main/mobile/eas.json
sed -i '' "s/$OLD_IP/$NEW_IP/g" src/main/mobile/app.json
sed -i '' "s/$OLD_IP/$NEW_IP/g" src/main/mobile/app.config.ts
sed -i '' "s/$OLD_IP/$NEW_IP/g" src/main/mobile/config/auth.ts

# 2. API 패키지 설정 업데이트
echo "🔌 API 패키지 설정 업데이트..."
sed -i '' "s/$OLD_IP/$NEW_IP/g" packages/api/src/instance.native.ts


# 3. 변경사항 확인
echo "✅ 변경 완료! 다음 파일들이 업데이트되었습니다:"
echo "   - src/main/mobile/eas.json"
echo "   - src/main/mobile/app.json"
echo "   - src/main/mobile/app.config.ts"
echo "   - src/main/mobile/config/auth.ts"
echo "   - packages/api/src/instance.native.ts"

echo ""
echo "🚀 다음 단계:"
echo "   1. 모바일 앱 재시작: cd src/main/mobile && npx expo start --clear"
echo "   2. 프론트엔드 재시작: cd src/main/frontend && npm start"
