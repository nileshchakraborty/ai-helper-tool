import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Policy Engine - Cedar-inspired policy evaluation
 * 
 * Provides deterministic control over AI agent actions through
 * declarative JSON policies. Similar to AWS AgentCore but runs locally.
 */

export interface Policy {
    id: string;
    description?: string;
    effect: 'permit' | 'deny';
    principal?: {
        role?: string;
        userId?: string;
        any?: boolean;
    };
    action: string | string[];
    resource?: {
        tools?: string[];
        endpoints?: string[];
        any?: boolean;
    };
    conditions?: {
        rateLimit?: string;        // e.g., "100/hour"
        timeWindow?: string;       // e.g., "09:00-17:00"
        inputMaxLength?: number;   // Max prompt length
        requireAuth?: boolean;
    };
}

export interface PolicyContext {
    userId?: string;
    role?: string;
    action: string;
    resource: string;
    input?: string;
    timestamp: Date;
    requestCount?: number;
}

export interface PolicyResult {
    allowed: boolean;
    matchedPolicy?: string;
    reason?: string;
    violations: string[];
}

// Default policies - secure by default
const DEFAULT_POLICIES: Policy[] = [
    {
        id: 'allow-public-ai',
        description: 'Allow public AI endpoints',
        effect: 'permit',
        principal: { any: true },
        action: ['invoke_tool', 'api_call'],
        resource: {
            endpoints: [
                '/coding/assist',
                '/behavioral/answer',
                '/case/analyze',
                '/coach/natural',
                '/listen/assist',
                '/image/*'
            ]
        }
    },
    {
        id: 'rate-limit-ai',
        description: 'Rate limit AI requests',
        effect: 'permit',
        principal: { any: true },
        action: 'invoke_tool',
        conditions: {
            rateLimit: '100/hour'
        }
    },
    {
        id: 'input-length-limit',
        description: 'Limit input prompt length',
        effect: 'permit',
        principal: { any: true },
        action: '*',
        conditions: {
            inputMaxLength: 10000
        }
    },
    {
        id: 'deny-admin-tools',
        description: 'Deny access to admin tools',
        effect: 'deny',
        principal: { role: 'user' },
        action: 'invoke_tool',
        resource: {
            tools: ['delete_session', 'delete_profile', 'admin_*']
        }
    }
];

export class PolicyEngine {
    private policies: Policy[] = [];
    private requestCounts: Map<string, { count: number; windowStart: Date }> = new Map();

    constructor(policies?: Policy[]) {
        this.policies = policies || [...DEFAULT_POLICIES];
    }

    /**
     * Load policies from an array
     */
    loadPolicies(policies: Policy[]): void {
        this.policies = [...this.policies, ...policies];
        console.log(`[PolicyEngine] Loaded ${policies.length} policies. Total: ${this.policies.length}`);
    }

    /**
     * Evaluate a context against all policies
     */
    evaluate(context: PolicyContext): PolicyResult {
        const violations: string[] = [];
        let allowed = true;
        let matchedPolicy: string | undefined;
        let reason: string | undefined;

        // Find matching policies
        for (const policy of this.policies) {
            if (!this.matchesPolicy(policy, context)) {
                continue;
            }

            matchedPolicy = policy.id;

            // Check conditions
            const conditionResult = this.checkConditions(policy, context);
            if (!conditionResult.passed) {
                violations.push(...conditionResult.violations);
            }

            // Apply effect
            if (policy.effect === 'deny') {
                allowed = false;
                reason = `Denied by policy: ${policy.id}`;
                break;
            }
        }

        // If there are condition violations, deny
        if (violations.length > 0) {
            allowed = false;
            reason = reason || `Condition violations: ${violations.join(', ')}`;
        }

        return { allowed, matchedPolicy, reason, violations };
    }

    /**
     * Enforce policy - throws if not allowed
     */
    enforce(context: PolicyContext): void {
        const result = this.evaluate(context);
        if (!result.allowed) {
            const error = new PolicyViolationError(
                result.reason || 'Policy violation',
                result.matchedPolicy,
                result.violations
            );
            throw error;
        }
    }

    /**
     * Check if context matches policy principal, action, and resource
     */
    private matchesPolicy(policy: Policy, context: PolicyContext): boolean {
        // Check principal
        if (policy.principal) {
            if (!policy.principal.any) {
                if (policy.principal.role && context.role !== policy.principal.role) {
                    return false;
                }
                if (policy.principal.userId && context.userId !== policy.principal.userId) {
                    return false;
                }
            }
        }

        // Check action
        const actions = Array.isArray(policy.action) ? policy.action : [policy.action];
        const actionMatches = actions.some(a =>
            a === '*' || a === context.action || this.wildcardMatch(a, context.action)
        );
        if (!actionMatches) {
            return false;
        }

        // Check resource
        if (policy.resource && !policy.resource.any) {
            const resourceMatches = this.matchesResource(policy.resource, context.resource);
            if (!resourceMatches) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check resource matching
     */
    private matchesResource(resource: Policy['resource'], contextResource: string): boolean {
        if (!resource) return true;

        const allPatterns = [
            ...(resource.tools || []),
            ...(resource.endpoints || [])
        ];

        return allPatterns.some(pattern =>
            pattern === contextResource || this.wildcardMatch(pattern, contextResource)
        );
    }

    /**
     * Check policy conditions
     */
    private checkConditions(
        policy: Policy,
        context: PolicyContext
    ): { passed: boolean; violations: string[] } {
        const violations: string[] = [];

        if (!policy.conditions) {
            return { passed: true, violations: [] };
        }

        // Rate limit check
        if (policy.conditions.rateLimit) {
            const [limit, period] = this.parseRateLimit(policy.conditions.rateLimit);
            const key = `${context.userId || 'anonymous'}:${policy.id}`;

            if (!this.checkRateLimit(key, limit, period)) {
                violations.push(`Rate limit exceeded: ${policy.conditions.rateLimit}`);
            }
        }

        // Input length check
        if (policy.conditions.inputMaxLength && context.input) {
            if (context.input.length > policy.conditions.inputMaxLength) {
                violations.push(`Input too long: ${context.input.length} > ${policy.conditions.inputMaxLength}`);
            }
        }

        return { passed: violations.length === 0, violations };
    }

    /**
     * Parse rate limit string like "100/hour"
     */
    private parseRateLimit(rateLimit: string): [number, number] {
        const match = rateLimit.match(/(\d+)\/(second|minute|hour|day)/);
        if (!match) return [100, 3600000]; // default 100/hour

        const limit = parseInt(match[1]);
        const periodMs = {
            second: 1000,
            minute: 60000,
            hour: 3600000,
            day: 86400000
        }[match[2]] || 3600000;

        return [limit, periodMs];
    }

    /**
     * Check rate limit for a key
     */
    private checkRateLimit(key: string, limit: number, periodMs: number): boolean {
        const now = new Date();
        const record = this.requestCounts.get(key);

        if (!record || (now.getTime() - record.windowStart.getTime() > periodMs)) {
            this.requestCounts.set(key, { count: 1, windowStart: now });
            return true;
        }

        if (record.count >= limit) {
            return false;
        }

        record.count++;
        return true;
    }

    /**
     * Simple wildcard matching
     */
    private wildcardMatch(pattern: string, value: string): boolean {
        if (!pattern.includes('*')) {
            return pattern === value;
        }

        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(value);
    }
}

/**
 * Custom error for policy violations
 */
export class PolicyViolationError extends Error {
    public policyId?: string;
    public violations: string[];

    constructor(message: string, policyId?: string, violations: string[] = []) {
        super(message);
        this.name = 'PolicyViolationError';
        this.policyId = policyId;
        this.violations = violations;
    }
}

// Singleton instance
export const policyEngine = new PolicyEngine();
