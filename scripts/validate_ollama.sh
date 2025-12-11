#!/bin/bash

BASE_URL="http://localhost:3000/v1"
EMAIL="testuser_$(date +%s)@example.com"
PASSWORD="Password123!"

echo "1. Registering User ($EMAIL)..."
SIGNUP_RES=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"fullName\": \"Test User\"}")

# Extract Token (Simple Node script inline)
TOKEN=$(echo $SIGNUP_RES | node -e "try { console.log(JSON.parse(fs.readFileSync(0, 'utf-8')).accessToken); } catch(e) { console.error('Failed to parse token'); process.exit(1); }")

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication Failed"
  echo "Response: $SIGNUP_RES"
  exit 1
fi

echo "✅ Authenticated! Token: ${TOKEN:0:10}..."

echo -e "\n2. Testing Behavioral Answer (Ollama)..."
curl -N -X POST "$BASE_URL/behavioral/answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question": "Why do you want to work here?",
    "context": "Software Engineer role at Google",
    "provider": "local",
    "sessionId": "test-session-1"
  }'

echo -e "\n\n3. Testing Coding Assist (Ollama)..."
curl -N -X POST "$BASE_URL/coding/assist" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question": "Reverse a linked list",
    "code": "class Node { int val; Node next; }",
    "provider": "local",
    "sessionId": "test-session-1"
  }'

