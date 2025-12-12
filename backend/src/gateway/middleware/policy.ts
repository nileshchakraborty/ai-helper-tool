import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { policyEngine, PolicyContext, PolicyViolationError } from '../../security/policy-engine';

/**
 * Policy Middleware - AgentCore-inspired request filtering
 * 
 * Intercepts all requests and evaluates them against active policies.
 * Provides:
 * - Rate limiting
 * - Input validation
 * - Access control
 * - Audit logging
 */

export interface AuditLogEntry {
    timestamp: Date;
    userId?: string;
    action: string;
    resource: string;
    allowed: boolean;
    reason?: string;
    requestId: string;
    ip: string;
}

// In-memory audit log (replace with DB in production)
const auditLog: AuditLogEntry[] = [];

export const policyMiddleware = fp(async (fastify: FastifyInstance) => {

    // Add audit log to fastify instance
    fastify.decorate('auditLog', auditLog);

    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
        const url = request.url;
        const method = request.method;

        // Skip health checks
        if (url === '/health') {
            return;
        }

        // Build policy context
        const context: PolicyContext = {
            userId: (request as any).user?.id || getClientId(request),
            role: (request as any).user?.role || 'anonymous',
            action: getActionFromRequest(method, url),
            resource: url,
            input: getInputFromRequest(request),
            timestamp: new Date()
        };

        try {
            // Evaluate policies
            policyEngine.enforce(context);

            // Log successful access
            logAudit({
                timestamp: context.timestamp,
                userId: context.userId,
                action: context.action,
                resource: context.resource,
                allowed: true,
                requestId: request.id,
                ip: request.ip
            });

        } catch (error) {
            if (error instanceof PolicyViolationError) {
                // Log violation
                logAudit({
                    timestamp: context.timestamp,
                    userId: context.userId,
                    action: context.action,
                    resource: context.resource,
                    allowed: false,
                    reason: error.message,
                    requestId: request.id,
                    ip: request.ip
                });

                return reply.status(403).send({
                    error: 'Policy Violation',
                    message: error.message,
                    policyId: error.policyId,
                    violations: error.violations
                });
            }
            throw error;
        }
    });

    // Expose audit log endpoint
    fastify.get('/admin/audit-log', {
        preHandler: async (request, reply) => {
            // Only allow authenticated admin access
            const user = (request as any).user;
            if (!user || user.role !== 'admin') {
                return reply.status(403).send({ error: 'Admin access required' });
            }
        }
    }, async (request, reply) => {
        const limit = parseInt((request.query as any).limit) || 100;
        return reply.send(auditLog.slice(-limit));
    });
});

/**
 * Determine action type from HTTP method and URL
 */
function getActionFromRequest(method: string, url: string): string {
    if (url.includes('/coding/') || url.includes('/behavioral/') ||
        url.includes('/case/') || url.includes('/coach/') ||
        url.includes('/listen/') || url.includes('/image/')) {
        return 'invoke_tool';
    }

    if (method === 'GET') return 'read';
    if (method === 'POST') return 'create';
    if (method === 'PUT' || method === 'PATCH') return 'update';
    if (method === 'DELETE') return 'delete';

    return 'api_call';
}

/**
 * Extract input from request for validation
 */
function getInputFromRequest(request: FastifyRequest): string | undefined {
    const body = request.body as any;
    if (!body) return undefined;

    // Concatenate relevant text fields
    const textFields = ['question', 'prompt', 'code', 'description', 'message', 'input'];
    const texts = textFields
        .filter(field => body[field])
        .map(field => body[field]);

    return texts.length > 0 ? texts.join(' ') : undefined;
}

/**
 * Get client identifier for anonymous rate limiting
 */
function getClientId(request: FastifyRequest): string {
    return `anon_${request.ip}`;
}

/**
 * Add entry to audit log
 */
function logAudit(entry: AuditLogEntry): void {
    auditLog.push(entry);

    // Keep only last 10000 entries in memory
    if (auditLog.length > 10000) {
        auditLog.shift();
    }

    // Log violations to console
    if (!entry.allowed) {
        console.warn(`[PolicyMiddleware] VIOLATION: ${entry.action} on ${entry.resource} by ${entry.userId} - ${entry.reason}`);
    }
}

export { auditLog };
