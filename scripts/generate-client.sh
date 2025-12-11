#!/bin/bash
set -e

OPENAPI_GENERATOR="npx -y @openapitools/openapi-generator-cli"
SPECS_PATH="openapi.yaml"
OUTPUT_DIR="client-mac/MacInterviewCopilot/Core/Networking/OpenAPIClient"

echo "Generating Swift Client..."
$OPENAPI_GENERATOR generate \
    -i "$SPECS_PATH" \
    -g swift5 \
    -o "$OUTPUT_DIR" \
    --additional-properties=projectName=OpenAPIClient,responseAs=Result,podSource=Local \
    --skip-validate-spec

echo "Done."
