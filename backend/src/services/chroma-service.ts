/**
 * ChromaDB Vector Store Service
 * Persistent vector storage for RAG retrieval
 */
import { ChromaClient, Collection } from 'chromadb';

interface Document {
    id: string;
    content: string;
    metadata?: Record<string, string | number | boolean | null>;
}

interface SearchResult {
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
}

export class ChromaService {
    private client: ChromaClient;
    private collections: Map<string, Collection> = new Map();
    private initialized = false;

    constructor() {
        this.client = new ChromaClient({
            path: process.env.CHROMA_URL || 'http://localhost:8000',
        });
    }

    /**
     * Initialize connection and ensure collections exist
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Create default collections
            const collectionNames = [
                'interview_questions',
                'coding_patterns',
                'user_sessions',
                'company_guides',
            ];

            for (const name of collectionNames) {
                const collection = await this.client.getOrCreateCollection({
                    name,
                    metadata: { 'hnsw:space': 'cosine' },
                });
                this.collections.set(name, collection);
            }

            this.initialized = true;
            console.log('[ChromaDB] Initialized with collections:', collectionNames);
        } catch (error) {
            console.error('[ChromaDB] Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * Add documents to a collection
     */
    async addDocuments(
        collectionName: string,
        documents: Document[],
        embeddings?: number[][]
    ): Promise<void> {
        await this.initialize();
        const collection = this.collections.get(collectionName);

        if (!collection) {
            throw new Error(`Collection ${collectionName} not found`);
        }

        await collection.add({
            ids: documents.map(d => d.id),
            documents: documents.map(d => d.content),
            metadatas: documents.map(d => d.metadata || {}),
            embeddings: embeddings,
        });
    }

    /**
     * Search for similar documents
     */
    async search(
        collectionName: string,
        query: string,
        topK: number = 5
    ): Promise<SearchResult[]> {
        await this.initialize();
        const collection = this.collections.get(collectionName);

        if (!collection) {
            console.warn(`[ChromaDB] Collection ${collectionName} not found`);
            return [];
        }

        const results = await collection.query({
            queryTexts: [query],
            nResults: topK,
        });

        // Transform results
        const searchResults: SearchResult[] = [];
        const ids = results.ids?.[0] || [];
        const documents = results.documents?.[0] || [];
        const distances = results.distances?.[0] || [];
        const metadatas = results.metadatas?.[0] || [];

        for (let i = 0; i < ids.length; i++) {
            searchResults.push({
                id: ids[i],
                content: documents[i] || '',
                score: 1 - (distances[i] || 0), // Convert distance to similarity
                metadata: metadatas[i] as Record<string, unknown>,
            });
        }

        return searchResults;
    }

    /**
     * Delete documents from a collection
     */
    async deleteDocuments(collectionName: string, ids: string[]): Promise<void> {
        await this.initialize();
        const collection = this.collections.get(collectionName);

        if (!collection) return;

        await collection.delete({ ids });
    }

    /**
     * Get collection stats
     */
    async getCollectionStats(collectionName: string): Promise<{ count: number } | null> {
        await this.initialize();
        const collection = this.collections.get(collectionName);

        if (!collection) return null;

        const count = await collection.count();
        return { count };
    }
}

// Singleton instance
let chromaService: ChromaService | null = null;

export function getChromaService(): ChromaService {
    if (!chromaService) {
        chromaService = new ChromaService();
    }
    return chromaService;
}
