# Verification Strategy

## Automated Checks
- **Linting**: `npm run lint` (ESLint + Prettier).
- **Types**: `npm run typecheck` (`tsc --noEmit`).

## Manual Verification

### Accessibility
- **Keyboard Navigation**: Ensure app works without mouse.
- **VoiceOver**: Basic readout testing for overlay and chat.

### AI Adversarial Testing
Goal: Ensure robust handling of edge-case prompts.
1. **Ambiguous Context**: Send coding request with conflicting screen vs text info. Result must be strictly typed JSON.
2. **Injection**: Try prompt injection in context. Ensure backend provider abstraction sanitizes or handles it.
3. **Drift**: Verify streaming format (SSE) integrity under load.

### Privacy
- **Session History OFF**:
  1. Toggle "History" OFF in client.
  2. Perform interview session.
  3. Verify Postgres `sessions` table is empty.
  4. Verify Redis keys expire after short TTL.
