# Verification Strategy

## Automated Checks
- **Unit Tests**: `npm test` (Backend).
- **E2E Tests**: `npm test -- tests/e2e.test.ts` (Validates full API flow including System Design & Case Interview).
- **Linting**: `npm run lint` (ESLint + Prettier).
- **Types**: `npm run typecheck` (`tsc --noEmit`).

## Feature Verification

### Knowledge Graph Personalization
- **Script**: `npm run verify-personalization` (or `npx ts-node scripts/verify-personalization.ts`)
- **Action**: Simulates user with weak areas (e.g., Dynamic Programming) and ensures AI prompts are modified.

### System Design
- **Action**: Use `/v1/system-design/analyze`.
- **Verify**: Response includes Mermaid diagram syntax and architectural analysis.

### MBA Case Interview
- **Action**: Use `/v1/case/analyze` with consulting context (e.g., BCG, McKinsey).
- **Verify**: Response uses Hypothesis-Driven framework.

## Manual Verification

### Accessibility
- **Keyboard Navigation**: Ensure app works without mouse.
- **VoiceOver**: Basic readout testing for overlay and chat.

### Privacy
- **Session History OFF**:
  1. Toggle "History" OFF in client.
  2. Perform interview session.
  3. Verify Postgres `sessions` table is empty.
  4. Verify Redis keys expire after short TTL.

