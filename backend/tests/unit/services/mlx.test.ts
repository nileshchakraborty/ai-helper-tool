import { MLXProvider } from '../../../src/services/ai-orchestrator/providers/mlx';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MLXProvider', () => {
    let provider: MLXProvider;

    beforeEach(() => {
        provider = new MLXProvider();
        mockFetch.mockReset();
    });

    describe('isAvailable', () => {
        it('should return true if health check is ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            });

            const result = await provider.isAvailable();
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/health'), expect.anything());
        });

        it('should return false if health check fails', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

            const result = await provider.isAvailable();
            expect(result).toBe(false);
        });
    });

    describe('generateImage', () => {
        it('should return error if service is unavailable', async () => {
            // Mock isAvailable -> false
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

            const result = await provider.generateImage({ prompt: 'test' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not available');
        });

        it('should return success result on valid response', async () => {
            // Mock isAvailable -> true
            mockFetch.mockResolvedValueOnce({ ok: true });

            // Mock generate -> success
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    image: 'base64data',
                    width: 512,
                    height: 512
                })
            });

            const result = await provider.generateImage({ prompt: 'test' });
            expect(result.success).toBe(true);
            expect(result.imageBase64).toBe('base64data');
        });

        it('should handle API errors', async () => {
            // Mock isAvailable -> true
            mockFetch.mockResolvedValueOnce({ ok: true });

            // Mock generate -> 500
            mockFetch.mockResolvedValueOnce({
                ok: false,
                text: async () => 'Internal Error'
            });

            const result = await provider.generateImage({ prompt: 'test' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Internal Error');
        });
    });
});
