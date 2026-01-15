#!/bin/bash
# setup_secrets.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== MoodDisk Secrets Manager 설정 ===${NC}"

# 1. AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERROR: AWS CLI가 설치되지 않았습니다${NC}"
    echo "설치 방법: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# 2. AWS 자격 증명 확인
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}ERROR: AWS 자격 증명이 설정되지 않았습니다${NC}"
    echo "설정 방법: aws configure"
    exit 1
fi

# 3. Secrets Manager 생성
SECRET_NAME="mooddisk/encryption-key"

# 환경변수에서 암호화 키 가져오기
if [ -z "$ENCRYPTION_KEY" ]; then
    echo -e "${RED}ERROR: ENCRYPTION_KEY 환경변수가 설정되지 않았습니다${NC}"
    echo "사용법: ENCRYPTION_KEY='your-key-here' ./setup_secrets.sh"
    echo "또는: export ENCRYPTION_KEY='your-key-here' && ./setup_secrets.sh"
    exit 1
fi

SECRET_VALUE="$ENCRYPTION_KEY"

echo -e "${YELLOW}Secrets Manager 생성 중: $SECRET_NAME${NC}"

# 기존 시크릿 확인
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" &> /dev/null; then
    echo -e "${YELLOW}기존 시크릿이 존재합니다. 업데이트하시겠습니까? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}시크릿 업데이트 중...${NC}"
        aws secretsmanager update-secret \
            --secret-id "$SECRET_NAME" \
            --secret-string "$SECRET_VALUE"
        echo -e "${GREEN}시크릿 업데이트 완료!${NC}"
    else
        echo -e "${YELLOW}시크릿 생성 취소됨${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}새 시크릿 생성 중...${NC}"
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "MoodDisk diary encryption key" \
        --secret-string "$SECRET_VALUE" \
        --region ap-northeast-2
    echo -e "${GREEN}시크릿 생성 완료!${NC}"
fi

# 4. 생성 확인
echo -e "${YELLOW}생성 확인 중...${NC}"
SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --query 'ARN' --output text)
echo -e "${GREEN}Secrets Manager 생성 완료!${NC}"
echo -e "${GREEN}Secret ARN: $SECRET_ARN${NC}"

# 5. 테스트
echo -e "${YELLOW}테스트 중...${NC}"
RETRIEVED_KEY=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --query 'SecretString' --output text)
if [ "$RETRIEVED_KEY" = "$SECRET_VALUE" ]; then
    echo -e "${GREEN}테스트 성공! 키가 올바르게 저장되었습니다${NC}"
else
    echo -e "${RED}테스트 실패! 저장된 키가 다릅니다${NC}"
    exit 1
fi

echo -e "${GREEN}=== 설정 완료 ===${NC}"
echo -e "${YELLOW}다음 단계:${NC}"
echo "1. application.yaml에서 aws.secrets.encryption-key-id 설정"
echo "2. EncryptionUtils.java 수정"
echo "3. 애플리케이션 재시작"
echo ""
echo -e "${YELLOW}보안 참고사항:${NC}"
echo "- 암호화 키는 환경변수로만 전달하세요"
echo "- 스크립트 실행: ENCRYPTION_KEY='your-key' ./setup_secrets.sh"
echo "- 키는 코드 저장소에 커밋하지 마세요"
