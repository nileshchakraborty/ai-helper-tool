#!/bin/bash
# OpenAPI Validation Script
# Validates the openapi.yaml against the OpenAPI 3.0 spec

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OPENAPI_FILE="$ROOT_DIR/openapi.yaml"

echo "🔍 Validating OpenAPI spec..."

# Check if openapi.yaml exists
if [ ! -f "$OPENAPI_FILE" ]; then
    echo "❌ Error: $OPENAPI_FILE not found"
    exit 1
fi

# Try to use spectral if available (preferred)
if command -v spectral &> /dev/null; then
    echo "   Using Spectral for validation..."
    spectral lint "$OPENAPI_FILE" --ruleset "$ROOT_DIR/.spectral.yaml" 2>/dev/null || \
    spectral lint "$OPENAPI_FILE"
    echo "✅ OpenAPI spec is valid!"
    exit 0
fi

# Fallback: Use npx @stoplight/spectral-cli
if command -v npx &> /dev/null; then
    echo "   Using npx spectral for validation..."
    npx --yes @stoplight/spectral-cli lint "$OPENAPI_FILE"
    echo "✅ OpenAPI spec is valid!"
    exit 0
fi

# Fallback: Basic YAML syntax check with node
if command -v node &> /dev/null; then
    echo "   Using Node.js for basic YAML validation..."
    node -e "
        const fs = require('fs');
        const yaml = require('yaml');
        try {
            const content = fs.readFileSync('$OPENAPI_FILE', 'utf8');
            const doc = yaml.parse(content);
            if (!doc.openapi) {
                console.error('❌ Missing openapi version field');
                process.exit(1);
            }
            if (!doc.info || !doc.info.title) {
                console.error('❌ Missing info.title');
                process.exit(1);
            }
            if (!doc.paths || Object.keys(doc.paths).length === 0) {
                console.error('❌ No paths defined');
                process.exit(1);
            }
            console.log('✅ OpenAPI spec is valid (basic check)');
            console.log('   Version: ' + doc.openapi);
            console.log('   Title: ' + doc.info.title);
            console.log('   Paths: ' + Object.keys(doc.paths).length);
        } catch (e) {
            console.error('❌ Parse error:', e.message);
            process.exit(1);
        }
    "
    exit 0
fi

echo "⚠️  No validation tool available. Install spectral:"
echo "   npm install -g @stoplight/spectral-cli"
exit 1
