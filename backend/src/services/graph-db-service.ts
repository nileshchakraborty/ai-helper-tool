/**
 * Neo4j Knowledge Graph Service
 * Graph database for relationship tracking and personalization
 */
import neo4j, { Driver, Session } from 'neo4j-driver';

interface PracticeRecord {
    userId: string;
    questionType: string;
    score: number;
    timestamp?: Date;
}

interface WeakArea {
    type: string;
    averageScore: number;
}

interface ConceptRelation {
    from: string;
    relation: string;
    to: string;
}

export class GraphDBService {
    private driver: Driver;
    private initialized = false;

    constructor() {
        const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'interview123';

        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }

    /**
     * Initialize connection and create indexes
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        const session = this.driver.session();
        try {
            // Create indexes for faster lookups
            await session.run(`
                CREATE INDEX user_id IF NOT EXISTS FOR (u:User) ON (u.id)
            `);
            await session.run(`
                CREATE INDEX question_type IF NOT EXISTS FOR (q:QuestionType) ON (q.name)
            `);
            await session.run(`
                CREATE INDEX concept_name IF NOT EXISTS FOR (c:Concept) ON (c.name)
            `);

            this.initialized = true;
            console.log('[Neo4j] Initialized with indexes');
        } catch (error) {
            console.error('[Neo4j] Failed to initialize:', error);
            throw error;
        } finally {
            await session.close();
        }
    }

    /**
     * Record a practice session
     */
    async recordPractice(record: PracticeRecord): Promise<void> {
        await this.initialize();
        const session = this.driver.session();

        try {
            await session.run(`
                MERGE (u:User {id: $userId})
                MERGE (q:QuestionType {name: $questionType})
                CREATE (u)-[:PRACTICED {
                    score: $score,
                    timestamp: datetime()
                }]->(q)
            `, {
                userId: record.userId,
                questionType: record.questionType,
                score: record.score,
            });
        } finally {
            await session.close();
        }
    }

    /**
     * Find user's weak areas (low average scores)
     */
    async getWeakAreas(userId: string, threshold: number = 0.7): Promise<WeakArea[]> {
        await this.initialize();
        const session = this.driver.session();

        try {
            const result = await session.run(`
                MATCH (u:User {id: $userId})-[p:PRACTICED]->(q:QuestionType)
                WITH q.name AS type, AVG(p.score) AS avg
                WHERE avg < $threshold
                RETURN type, avg
                ORDER BY avg ASC
            `, { userId, threshold });

            return result.records.map(record => ({
                type: record.get('type'),
                averageScore: record.get('avg'),
            }));
        } finally {
            await session.close();
        }
    }

    /**
     * Get user's strong areas
     */
    async getStrongAreas(userId: string, threshold: number = 0.8): Promise<WeakArea[]> {
        await this.initialize();
        const session = this.driver.session();

        try {
            const result = await session.run(`
                MATCH (u:User {id: $userId})-[p:PRACTICED]->(q:QuestionType)
                WITH q.name AS type, AVG(p.score) AS avg
                WHERE avg >= $threshold
                RETURN type, avg
                ORDER BY avg DESC
            `, { userId, threshold });

            return result.records.map(record => ({
                type: record.get('type'),
                averageScore: record.get('avg'),
            }));
        } finally {
            await session.close();
        }
    }

    /**
     * Create a concept relationship
     */
    async createConceptRelation(relation: ConceptRelation): Promise<void> {
        await this.initialize();
        const session = this.driver.session();

        try {
            // Use dynamic relationship type
            await session.run(`
                MERGE (a:Concept {name: $from})
                MERGE (b:Concept {name: $to})
                MERGE (a)-[:${relation.relation}]->(b)
            `, { from: relation.from, to: relation.to });
        } finally {
            await session.close();
        }
    }

    /**
     * Find related concepts
     */
    async findRelatedConcepts(conceptName: string, depth: number = 2): Promise<string[]> {
        await this.initialize();
        const session = this.driver.session();

        try {
            const result = await session.run(`
                MATCH (c:Concept {name: $name})-[*1..${depth}]-(related:Concept)
                RETURN DISTINCT related.name AS concept
            `, { name: conceptName });

            return result.records.map(record => record.get('concept'));
        } finally {
            await session.close();
        }
    }

    /**
     * Get user's practice history summary
     */
    async getUserSummary(userId: string): Promise<{
        totalPractices: number;
        questionTypes: string[];
        lastActive: string | null;
    }> {
        await this.initialize();
        const session = this.driver.session();

        try {
            const result = await session.run(`
                MATCH (u:User {id: $userId})-[p:PRACTICED]->(q:QuestionType)
                RETURN 
                    COUNT(p) AS total,
                    COLLECT(DISTINCT q.name) AS types,
                    MAX(p.timestamp) AS lastActive
            `, { userId });

            const record = result.records[0];
            return {
                totalPractices: record?.get('total')?.toNumber() || 0,
                questionTypes: record?.get('types') || [],
                lastActive: record?.get('lastActive')?.toString() || null,
            };
        } finally {
            await session.close();
        }
    }

    /**
     * Close the driver connection
     */
    async close(): Promise<void> {
        await this.driver.close();
    }
}

// Singleton instance
let graphDBService: GraphDBService | null = null;

export function getGraphDBService(): GraphDBService {
    if (!graphDBService) {
        graphDBService = new GraphDBService();
    }
    return graphDBService;
}
