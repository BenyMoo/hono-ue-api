#!/bin/bash

# 基础连接测试
echo "=== 基础连接测试 ==="
curl -s http://127.0.0.1:8787/health | jq .

echo -e "\n=== API文档测试 ==="
curl -s http://127.0.0.1:8787/doc | head -n 5
curl -s http://127.0.0.1:8787/ui | head -n 5

# 用户注册和登录测试
echo -e "\n=== 用户注册测试 ==="
curl -X POST http://127.0.0.1:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "nickname": "测试用户"
  }' | jq .

echo -e "\n=== 用户登录测试 ==="
LOGIN_RESPONSE=$(curl -s -X POST http://127.0.0.1:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

echo -e "\n=== 获取用户信息 ==="
curl -s -X GET http://127.0.0.1:8787/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq .

# 签到相关接口测试
echo -e "\n=== 今日签到状态查询 ==="
curl -s -X GET http://127.0.0.1:8787/api/checkin/status \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 执行签到 ==="
curl -s -X POST http://127.0.0.1:8787/api/checkin/ \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 签到历史查询 ==="
curl -s -X GET http://127.0.0.1:8787/api/checkin/history \
  -H "Authorization: Bearer $TOKEN" | jq .

# 会员相关接口测试
echo -e "\n=== 会员状态查询 ==="
curl -s -X GET http://127.0.0.1:8787/api/membership/status \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 兑换会员 ==="
curl -s -X POST http://127.0.0.1:8787/api/membership/redeem \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 会员兑换历史 ==="
curl -s -X GET http://127.0.0.1:8787/api/membership/redeem-history \
  -H "Authorization: Bearer $TOKEN" | jq .

# 统计相关接口测试
echo -e "\n=== 用户统计信息 ==="
curl -s -X GET http://127.0.0.1:8787/api/stats/user \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 积分排行榜 ==="
curl -s -X GET "http://127.0.0.1:8787/api/stats/leaderboard?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 系统统计信息 ==="
curl -s -X GET http://127.0.0.1:8787/api/stats/system \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== 测试完成 ==="