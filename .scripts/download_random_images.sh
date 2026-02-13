#!/bin/bash

# 랜덤 이미지 100장 다운로드 스크립트
# 출처: https://picsum.photos

OUTPUT_DIR="${1:-supabase/seeds/storage/temp/random_images}"
COUNT=100
SIZE=500

echo "📥 랜덤 이미지 ${COUNT}장 다운로드 시작..."
echo "📁 저장 경로: ${OUTPUT_DIR}"
echo ""

# 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

# 이미지 다운로드
for i in $(seq 1 $COUNT); do
    filename=$(printf "image_%03d.jpg" $i)
    filepath="${OUTPUT_DIR}/${filename}"

    # seed 값을 사용하여 각각 다른 이미지 다운로드
    url="https://picsum.photos/seed/${i}/500"

    echo -n "[$i/$COUNT] ${filename} 다운로드 중... "

    if curl -sL "$url" -o "$filepath"; then
        echo "✅"
    else
        echo "❌ 실패"
    fi

    # 서버 부하 방지를 위한 딜레이 (0.2초)
    sleep 0.2
done

echo ""
echo "✅ 다운로드 완료!"
echo "📁 저장 위치: ${OUTPUT_DIR}"
ls -la "$OUTPUT_DIR" | head -5
echo "... 총 $(ls -1 "$OUTPUT_DIR" | wc -l | tr -d ' ')개 파일"
