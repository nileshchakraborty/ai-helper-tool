export interface ValidationResult {
    isValid: boolean;
    reason?: string;
    sanitizedChunk?: string;
}

export class ResponseValidator {
    private accumulatedText: string = '';
    private readonly MAX_REPEATED_CHARS = 20;

    /**
     * Validate a stream chunk against common AI failure patterns
     */
    validateChunk(chunk: string): ValidationResult {
        this.accumulatedText += chunk;

        // 1. Check for infinite character repetition (e.g. "vvvvvvvvv")
        if (this.detectCharacterRepetition(chunk)) {
            return { isValid: false, reason: 'Infinite character repetition detected' };
        }

        // 2. Check for token artifacts/gibberish (basic heuristic)
        // If we see a long string with no spaces (heuristic for base64 dumping or glitch)
        if (this.detectGibberish(chunk)) {
            return { isValid: false, reason: 'Gibberish/High entropy detected' };
        }

        return { isValid: true, sanitizedChunk: chunk };
    }

    private detectCharacterRepetition(chunk: string): boolean {
        // Detect >20 repeated characters
        const repeatedCharRegex = /(.)\1{19,}/;
        return repeatedCharRegex.test(chunk);
    }

    private detectGibberish(currentChunk: string): boolean {
        // Check if the TRAILING 100 characters have no whitespace.
        // Genuine words are rarely >100 chars.
        // This handles cases where garbage is appended to valid text.

        const trailingWindow = this.accumulatedText.slice(-100);

        if (trailingWindow.length < 100) return false;

        if (!/\s/.test(trailingWindow)) {
            // Check if it's a URL (basic check - usually URLs have limits or specific chars)
            // But even URLs > 100 chars are suspicious in this context if they are just raw text.
            if (trailingWindow.startsWith('http') && trailingWindow.length < 150) return false;
            return true;
        }
        return false;
    }

    reset() {
        this.accumulatedText = '';
    }
}
