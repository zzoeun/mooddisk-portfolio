# AWS Secrets Manager 설정 가이드

## 개요

MoodDisk 애플리케이션의 암호화 키를 AWS Secrets Manager에 안전하게 저장하는 방법을 설명합니다.

## 보안 주의사항 ⚠️

- **암호화 키는 절대 코드 저장소에 커밋하지 마세요**
- 키는 환경변수로만 전달하세요
- 키가 노출되면 모든 암호화된 데이터가 위험합니다

## 설정 방법

### 1. 사전 준비

```bash
# AWS CLI 설치 확인
aws --version

# AWS 자격 증명 설정
aws configure
```

### 2. Secrets Manager 생성

```bash
# 환경변수로 암호화 키 설정
export ENCRYPTION_KEY="your-encryption-key-here"

# 스크립트 실행
./setup_secrets.sh
```

### 3. 생성 확인

- AWS 콘솔에서 `ap-northeast-2` 리전의 Secrets Manager 확인
- `mooddisk/encryption-key` 시크릿이 생성되었는지 확인

## 키 생성 방법

```bash
# 새로운 256비트 키 생성 (Base64 인코딩)
openssl rand -base64 32
```

## 문제 해결

- **AWS 자격 증명 오류**: `aws configure` 실행
- **권한 오류**: IAM 사용자에게 Secrets Manager 권한 부여
- **리전 오류**: `ap-northeast-2` 리전 사용 확인

## 보안 모범 사례

1. 정기적인 키 로테이션
2. 최소 권한 원칙 적용
3. 키 접근 로그 모니터링
4. 백업 키는 별도 안전한 위치에 저장
