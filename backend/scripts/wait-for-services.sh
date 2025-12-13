#!/bin/bash

# Configuration
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
TIMEOUT=30

echo "Waiting for services to be ready..."

# Function to check port
check_port() {
  local host=$1
  local port=$2
  local service=$3
  local i=0

  while ! nc -z $host $port; do
    i=$((i+1))
    if [ $i -ge $TIMEOUT ]; then
      echo "Error: Timed out waiting for $service at $host:$port"
      return 1
    fi
    echo "Waiting for $service ($host:$port)... $i/$TIMEOUT"
    sleep 1
  done
  echo "$service is ready!"
  return 0
}

# Check Postgres
check_port $POSTGRES_HOST $POSTGRES_PORT "Postgres" || exit 1

# Check Redis
check_port $REDIS_HOST $REDIS_PORT "Redis" || exit 1

echo "All critical services are ready."
exit 0
