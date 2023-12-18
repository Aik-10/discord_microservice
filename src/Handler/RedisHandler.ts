import { createClient, RedisClientType } from 'redis';

export class RedisHandler {
    public client: RedisClientType;

    constructor() {
        this.client = createClient({
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_ADDRESS,
                port: Number(process.env.REDIS_PORT) ?? 6379
            }
        });

        this.client.on('error', this.log);

        this.client.connect();
    }

    private log(err: any) {
        console.log('Redis Client Error', err)
    }
}