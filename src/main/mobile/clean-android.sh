#!/bin/bash

# Android 빌드 캐시 정리 스크립트
# CMake 캐시 손상 문제 해결용

echo "🧹 Android 빌드 캐시 정리 중..."

# 모바일 디렉토리로 이동
cd "$(dirname "$0")"

# 1. Gradle 캐시 정리
echo "1. Gradle 캐시 정리..."
cd android
./gradlew clean

# 2. CMake 캐시 삭제
echo "2. CMake 캐시 삭제..."
# 루트와 모바일 디렉토리의 node_modules 모두 정리
cd ../..
find node_modules -type d -name ".cxx" -exec rm -rf {} + 2>/dev/null || true
find src/main/mobile/node_modules -type d -name ".cxx" -exec rm -rf {} + 2>/dev/null || true
# configure_fingerprint.bin 파일도 삭제
find . -name "configure_fingerprint.bin" -delete 2>/dev/null || true
cd src/main/mobile
# 프로젝트 내 .cxx 폴더 삭제
rm -rf android/.cxx
rm -rf android/app/.cxx
rm -rf android/app/build
rm -rf android/build

# 3. Gradle 빌드 캐시 삭제 (로컬 프로젝트만, 전역 캐시는 유지)
echo "3. Gradle 빌드 캐시 삭제 (로컬 프로젝트만)..."
rm -rf android/.gradle
# 주의: ~/.gradle/caches는 삭제하지 않음 (백엔드 프로젝트에도 영향)
# 필요시 수동으로 삭제: rm -rf ~/.gradle/caches

# 4. node_modules의 네이티브 모듈 캐시 삭제
echo "4. 네이티브 모듈 캐시 삭제..."
find node_modules -type d -name ".cxx" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "build" -path "*/android/*" -exec rm -rf {} + 2>/dev/null || true

echo "✅ 캐시 정리 완료!"
echo ""
echo "다음 명령어로 다시 빌드하세요:"
echo "  yarn expo run:android --device"

