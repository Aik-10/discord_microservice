import Redis, { createClient, RedisClientType } from 'redis';

export class RedisHandler {
    public readonly client: RedisClientType;
    
    constructor() {
        this.client = createClient({
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_ADDRESS,
                port: Number(process.env.REDIS_PORT) ?? 6379
            }
        });
    }
}