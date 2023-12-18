import dotenv from 'dotenv';

import { DiscordRestApi } from './Services/DiscordRestApi';
import { RabbitMQHandler } from './Handler/RabbitMQHandler';

const isDev = process.env.NODE_ENV !== 'production'

try {
    dotenv.config();
    const discordRestApi = new DiscordRestApi();
    // const rabbitMQHandler = new RabbitMQHandler();
} catch (e: any) {
    console.error(e);
}

