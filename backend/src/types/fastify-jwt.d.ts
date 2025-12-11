import '@fastify/jwt'

declare module 'fastify' {
    interface FastifyInstance {
        jwt: {
            sign(payload: object, options?: any): string;
            verify(token: string, options?: any): any;
            decode(token: string, options?: any): any;
        }
    }
}
