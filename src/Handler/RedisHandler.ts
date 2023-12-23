import { createClient, RedisClientType } from 'redis';

export class RedisHandler {
    public client: RedisClientType;

    constructor() {
        this.client = createClient(
        {
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT || '6379', 10)
            }
        }
        );

        this.client.on('error', this.log);
    }

    private log(err: any) {
        console.log('Redis Client Error', err)
    }
}