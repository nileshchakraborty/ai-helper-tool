import { ResponseValidator } from '../../../src/services/ai-orchestrator/validation/response-validator';

describe('ResponseValidator', () => {
    let validator: ResponseValidator;

    beforeEach(() => {
        validator = new ResponseValidator();
    });

    it('should accept normal text', () => {
        const result = validator.validateChunk('This is a normal sentence.');
        expect(result.isValid).toBe(true);
    });

    it('should reject character repetition', () => {
        const result = validator.validateChunk('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('repetition');
    });

    it('should reject gibberish (long no-space string)', () => {
        const gibberish = 'abcdefghijklmnopqrstuvwxyz'.repeat(4); // 104 chars, no space
        const result = validator.validateChunk(gibberish);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('Gibberish');
    });

    it('should reject streamed gibberish (accumulation)', () => {
        // Stream small chunks that form gibberish
        const chunk = 'abcdefghij'; // 10 chars
        let failed = false;

        // Steam 12 chunks (120 chars total) -> should trigger >100 char limit
        for (let i = 0; i < 12; i++) {
            const result = validator.validateChunk(chunk);
            if (!result.isValid) {
                failed = true;
                expect(result.reason).toContain('Gibberish');
                break;
            }
        }
        expect(failed).toBe(true);
    });

    it('should allow code blocks (which have spaces)', () => {
        const code = 'function test() { console.log("hello"); }';
        const result = validator.validateChunk(code);
        expect(result.isValid).toBe(true);
    });
});
