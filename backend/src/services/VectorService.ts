import fs from 'fs';
import path from 'path';
import { Ollama } from 'ollama';

interface VectorDocument {
    id: string;
    source: string;
    text: string;
    embedding: number[];
}

export class VectorService {
    private static instance: VectorService;
    private documents: VectorDocument[] = [];
    private ollama: Ollama;
    private isLoaded = false;

    // Singleton
    private constructor() {
        // Configurable host
        this.ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });
        this.loadStore();
    }

    public static getInstance(): VectorService {
        if (!VectorService.instance) {
            VectorService.instance = new VectorService();
        }
        return VectorService.instance;
    }

    private loadStore() {
        const storePath = path.join(__dirname, '../../data/vector-store.json');
        if (fs.existsSync(storePath)) {
            try {
                const data = fs.readFileSync(storePath, 'utf-8');
                this.documents = JSON.parse(data);
                this.isLoaded = true;
                console.log(`[VectorService] Loaded ${this.documents.length} vectors into memory.`);
            } catch (e) {
                console.error('[VectorService] Failed to load vector store:', e);
            }
        } else {
            console.warn('[VectorService] No vector store found at', storePath);
        }
    }

    /**
     * Calculate Cosine Similarity
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Search for most relevant chunks
     */
    public async search(query: string, topK: number = 3): Promise<VectorDocument[]> {
        if (!this.isLoaded || this.documents.length === 0) return [];

        // 1. Embed Query
        // We assume the ingest model is 'nomic-embed-text'.
        // Must match the ingestion model!
        const response = await this.ollama.embeddings({
            model: 'nomic-embed-text',
            prompt: query
        });

        const queryVec = response.embedding;

        // 2. Brute Force Search
        const scored = this.documents.map(doc => ({
            doc,
            score: this.cosineSimilarity(queryVec, doc.embedding)
        }));

        // 3. Sort & Slice
        scored.sort((a, b) => b.score - a.score);

        return scored.slice(0, topK).map(s => s.doc);
    }
}
