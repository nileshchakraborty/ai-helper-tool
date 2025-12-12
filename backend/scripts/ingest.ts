import fs from 'fs';
import path from 'path';
import { Ollama } from 'ollama';
const pdf = require('pdf-parse');

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });
const EMBEDDING_MODEL = 'nomic-embed-text'; // Lightweight, good for retrieval
const DOCS_DIR = path.join(__dirname, '../data/docs');
const OUTPUT_FILE = path.join(__dirname, '../data/vector-store.json');

interface DocumentChunk {
    id: string;
    source: string;
    text: string;
    embedding: number[];
}

async function main() {
    console.log('🚀 Starting ingestion...');

    // 1. Check Model
    try {
        // Just a probe
        await ollama.list();
    } catch (e) {
        console.error('❌ Ollama not reachable. Is it running?');
        process.exit(1);
    }

    // 2. Read Files
    if (!fs.existsSync(DOCS_DIR)) {
        console.error(`❌ Docs directory not found: ${DOCS_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.pdf'));
    console.log(`found ${files.length} documents.`);

    if (files.length === 0) {
        console.log('⚠️ No .md/.txt/.pdf files found. Please add files to backend/data/docs/');
        process.exit(0);
    }

    const chunks: DocumentChunk[] = [];

    for (const file of files) {
        console.log(`Processing ${file}...`);
        let content = '';
        const filePath = path.join(DOCS_DIR, file);

        if (file.endsWith('.pdf')) {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            content = data.text;
        } else {
            content = fs.readFileSync(filePath, 'utf-8');
        }

        // Simple splitting by double newline (paragraphs)
        // For better RAG, use a recursive character splitter
        const rawChunks = content.split('\n\n').filter(c => c.trim().length > 50);

        for (const [i, text] of rawChunks.entries()) {
            try {
                const response = await ollama.embeddings({
                    model: EMBEDDING_MODEL,
                    prompt: text,
                });

                chunks.push({
                    id: `${file}-${i}`,
                    source: file,
                    text: text.trim(),
                    embedding: response.embedding,
                });

                process.stdout.write('.');
            } catch (error) {
                console.error(`\nFailed to embed chunk in ${file}:`, error);
                console.log(`\n💡 Hint: Run 'ollama pull ${EMBEDDING_MODEL}'`);
                process.exit(1);
            }
        }
        console.log('');
    }

    // 3. Save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chunks, null, 2));
    console.log(`✅ Saved ${chunks.length} vectors to ${OUTPUT_FILE}`);
    console.log(`RAM Usage Estimate: ~${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB on disk.`);
}

main();
