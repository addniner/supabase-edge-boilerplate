#!/bin/bash
# Git hooks 설치
# 사용법: .scripts/init-git-hook.sh

set -euo pipefail

git config core.hooksPath .scripts/hooks
echo "✅ Git hooks 설치 완료 (.scripts/hooks)"
