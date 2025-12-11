# Client-Mac

This folder contains the source code for the native macOS application.

## Development

1. **OpenAPI Generation**:
   The code in `Core/Networking/OpenAPIClient` should be generated from `../../openapi.yaml`.
   Do not edit it manually.

2. **Entitlements**:
   The app is sandboxed. Required permissions:
   - **Microphone**: For audio capture.
   - **Screen Recording**: For context (TCC permission, handled at runtime).

3. **Debug**:
   `PromptDebug` features are enabled only in Debug builds.
