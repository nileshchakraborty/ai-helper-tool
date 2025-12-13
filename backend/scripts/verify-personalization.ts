import { AIOrchestrator } from '../src/services/ai-orchestrator/orchestrator';
import { getGraphDBService } from '../src/services/graph-db-service';

async function main() {
    console.log('🧪 Verifying Knowledge Graph Personalization...');

    // 1. Setup Mock Data
    const userId = 'test-user-personalization';
    const graphDB = getGraphDBService();

    // Ensure graph DB is ready
    await graphDB.initialize();

    console.log(`Phase 1: Recording weak area for user: ${userId}`);
    await graphDB.recordPractice({
        userId,
        questionType: 'Dynamic Programming',
        score: 0.4 // Low score -> Weak Area
    });

    // Verify it was recorded
    const weakAreas = await graphDB.getWeakAreas(userId);
    console.log('Current Weak Areas:', weakAreas);

    if (!weakAreas.find(w => w.type === 'Dynamic Programming')) {
        console.error('❌ Failed to record weak area.');
        process.exit(1);
    }

    // 2. Test Orchestrator Prompt Injection
    // We can't easily intercept the prompt without mocking, but we can check if the Orchestrator runs without error
    // and ideally use a "dry run" or inspected log if we had one.
    // For this integration test, we will rely on key observation of the Orchestrator internal method via a temporary subclass or by simply running a request.

    console.log('Phase 2: Simulating AI Request...');
    const orchestrator = new AIOrchestrator();

    // We will verify by checking if the method executes successfully. 
    // Ideally we would inspect logs, but for now we ensure no crash and proper flow.
    try {
        // Using a simple question
        const stream = await orchestrator.streamBehavioralAnswer(
            "Tell me about a time you solved a hard problem",
            "Context: Dynamic Programming",
            "ollama", // Use local provider
            userId
        );

        console.log('Stream started. Consuming...');
        let response = "";
        for await (const chunk of stream) {
            response += chunk;
        }
        console.log('Stream finished. Length:', response.length);
        console.log('✅ Personalization flow executed successfully.');

    } catch (error) {
        console.error('❌ Orchestrator failed:', error);
        process.exit(1);
    } finally {
        await graphDB.close();
        await orchestrator.close();
    }
}

main().catch(console.error);
