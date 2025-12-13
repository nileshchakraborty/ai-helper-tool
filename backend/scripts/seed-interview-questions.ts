/**
 * Seed Script: Interview Questions to ChromaDB
 * Run: npx ts-node scripts/seed-interview-questions.ts
 */
import { ChromaClient } from 'chromadb';

// Sample behavioral interview questions with ideal STAR responses
const INTERVIEW_QUESTIONS = [
    {
        id: 'beh-001',
        content: `Q: Tell me about a time you had to deal with a difficult team member.
A: At [Company], I worked with a developer who frequently missed deadlines. Rather than escalating immediately, I scheduled a 1:1 to understand their challenges. I discovered they were overwhelmed with unclear requirements. I helped them break down tasks and set up daily standups. Within 2 weeks, their delivery rate improved by 80%. Learned: direct communication resolves most conflicts.`,
        metadata: { type: 'behavioral', category: 'conflict', difficulty: 'medium' }
    },
    {
        id: 'beh-002',
        content: `Q: Describe a situation where you failed and what you learned.
A: I once deployed a feature without adequate testing, causing a 2-hour outage affecting 10K users. I immediately owned the mistake, led the rollback, and wrote a post-mortem. I then implemented mandatory code reviews and staging environment tests. Result: zero production incidents in the following 6 months. Learned: shortcuts create technical debt.`,
        metadata: { type: 'behavioral', category: 'failure', difficulty: 'hard' }
    },
    {
        id: 'beh-003',
        content: `Q: Tell me about a time you showed leadership.
A: When our team lead left unexpectedly, I stepped up to coordinate a critical launch with 3 weeks remaining. I reorganized the backlog, ran daily syncs, and personally unblocked 2 engineers on API issues. We launched on time, exceeding engagement targets by 25%. I was later promoted to tech lead. Learned: leadership is about enabling others.`,
        metadata: { type: 'behavioral', category: 'leadership', difficulty: 'medium' }
    },
    {
        id: 'beh-004',
        content: `Q: Describe a time you had to meet a tight deadline.
A: Client requested a demo in 48 hours for a feature estimated at 2 weeks. I scoped a minimal viable demo, delegated UI to a teammate, and pair-programmed the core API. Worked 16-hour days but delivered. The demo secured a $2M contract. Learned: prioritization and delegation are key under pressure.`,
        metadata: { type: 'behavioral', category: 'deadline', difficulty: 'hard' }
    },
    {
        id: 'beh-005',
        content: `Q: Tell me about a time you had to convince others of your idea.
A: I proposed migrating from REST to GraphQL. Initial resistance from the team citing learning curve. I built a proof-of-concept showing 60% reduction in API calls, presented benchmarks, and offered to lead training sessions. After 3 weeks, the team unanimously approved. Migration reduced page load times by 40%. Learned: data wins arguments.`,
        metadata: { type: 'behavioral', category: 'influence', difficulty: 'medium' }
    },
];

// Sample coding patterns
const CODING_PATTERNS = [
    {
        id: 'code-001',
        content: `Pattern: Two Sum (HashMap)
Problem: Find two numbers that add to target.
Approach: Use HashMap to store complement (target - num).
Time: O(n), Space: O(n)
Code:
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i`,
        metadata: { type: 'coding', pattern: 'arrays-hashing', difficulty: 'easy' }
    },
    {
        id: 'code-002',
        content: `Pattern: Sliding Window - Maximum Sum Subarray
Problem: Find max sum of k consecutive elements.
Approach: Maintain window sum, slide right adding new element, removing left.
Time: O(n), Space: O(1)
Code:
def maxSumSubarray(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i-k]
        max_sum = max(max_sum, window_sum)
    return max_sum`,
        metadata: { type: 'coding', pattern: 'sliding-window', difficulty: 'easy' }
    },
    {
        id: 'code-003',
        content: `Pattern: Binary Search on Answer
Problem: Koko Eating Bananas - minimum eating speed to finish in H hours.
Approach: Binary search on speed [1, max(piles)]. Check if can finish at mid speed.
Time: O(n log m) where m = max pile size
Code:
def minEatingSpeed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        hours = sum((p + mid - 1) // mid for p in piles)
        if hours <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
        metadata: { type: 'coding', pattern: 'binary-search', difficulty: 'medium' }
    },
    {
        id: 'code-004',
        content: `Pattern: Monotonic Stack - Next Greater Element
Problem: For each element, find next greater element to its right.
Approach: Stack stores indices of elements waiting for their "next greater".
Time: O(n), Space: O(n)
Code:
def nextGreater(nums):
    result = [-1] * len(nums)
    stack = []
    for i, num in enumerate(nums):
        while stack and nums[stack[-1]] < num:
            result[stack.pop()] = num
        stack.append(i)
    return result`,
        metadata: { type: 'coding', pattern: 'stack', difficulty: 'medium' }
    },
    {
        id: 'code-005',
        content: `Pattern: BFS Level Order Traversal
Problem: Return nodes level by level in a binary tree.
Approach: Use queue, process all nodes at current level before moving to next.
Time: O(n), Space: O(n)
Code:
def levelOrder(root):
    if not root: return []
    result, queue = [], [root]
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.pop(0)
            level.append(node.val)
            if node.left: queue.append(node.left)
            if node.right: queue.append(node.right)
        result.append(level)
    return result`,
        metadata: { type: 'coding', pattern: 'trees-bfs', difficulty: 'medium' }
    },
];

async function seed() {
    console.log('🌱 Seeding ChromaDB with interview questions...\n');

    const client = new ChromaClient({
        path: process.env.CHROMA_URL || 'http://localhost:8000',
    });

    // Seed behavioral questions
    const behavioralCollection = await client.getOrCreateCollection({
        name: 'interview_questions',
        metadata: { 'hnsw:space': 'cosine' },
    });

    console.log('📝 Adding behavioral questions...');
    await behavioralCollection.add({
        ids: INTERVIEW_QUESTIONS.map(q => q.id),
        documents: INTERVIEW_QUESTIONS.map(q => q.content),
        metadatas: INTERVIEW_QUESTIONS.map(q => q.metadata),
    });
    console.log(`   Added ${INTERVIEW_QUESTIONS.length} behavioral questions`);

    // Seed coding patterns
    const codingCollection = await client.getOrCreateCollection({
        name: 'coding_patterns',
        metadata: { 'hnsw:space': 'cosine' },
    });

    console.log('💻 Adding coding patterns...');
    await codingCollection.add({
        ids: CODING_PATTERNS.map(p => p.id),
        documents: CODING_PATTERNS.map(p => p.content),
        metadatas: CODING_PATTERNS.map(p => p.metadata),
    });
    console.log(`   Added ${CODING_PATTERNS.length} coding patterns`);

    // Verify
    const behavioralCount = await behavioralCollection.count();
    const codingCount = await codingCollection.count();

    console.log('\n✅ Seeding complete!');
    console.log(`   interview_questions: ${behavioralCount} documents`);
    console.log(`   coding_patterns: ${codingCount} documents`);
}

seed().catch(console.error);
