@echo off
chcp 65001 >nul
setlocal
if "%~1"=="" (
  echo 用法: deploy-to-github.bat 你的GitHub用户名
  echo 示例: deploy-to-github.bat andon
  echo 将执行: git remote add origin https://github.com/andon/daily-plan.git ^& git push -u origin main
  exit /b 1
)
set "USER=%~1"
if not exist .git (
  git init
  git add .
  git commit -m "init: 每日计划 PWA"
  git branch -M main
) else (
  git add .
  git diff --staged --quiet 2>nul || git commit -m "update: 每日计划"
)
git remote remove origin 2>nul
git remote add origin "https://github.com/%USER%/daily-plan.git"
echo 正在推送到 https://github.com/%USER%/daily-plan.git ...
git push -u origin main
endlocal
