#!/bin/bash
# JWT Secret Generator
# Generates a cryptographically secure random string for JWT_SECRET

set -e

# Default length is 64 characters (512 bits)
LENGTH=${1:-64}

# Generate a random secret using OpenSSL
SECRET=$(openssl rand -base64 $LENGTH | tr -d '\n' | cut -c1-$LENGTH)

echo "Generated JWT Secret:"
echo ""
echo "$SECRET"
echo ""
echo "Add this to your .env file:"
echo "JWT_SECRET=$SECRET"
