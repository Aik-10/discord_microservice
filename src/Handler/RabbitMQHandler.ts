import { DiscordClientService } from '../Services/DiscordClientService';
import amqp, { Channel, ConsumeMessage } from 'amqplib';

export class RabbitMQHandler {
    private channel: Channel;
    private discordService: DiscordClientService;

    constructor() {
        this.setupRabbitMQ();
        this.discordService = new DiscordClientService();
    }

    private async setupRabbitMQ() {
        if (!process.env.QUEUE_CONNECT ) return;
        
        const connection = await amqp.connect(process.env.QUEUE_CONNECT);
        this.channel = await connection.createChannel();

        const queueName = process.env.QUEUE_NAME ?? 'private_messages';
        await this.channel.assertQueue(queueName, { durable: false });

        this.channel.consume(queueName, this.handlePrivateMessage.bind(this));
    }

    private async handlePrivateMessage(msg: ConsumeMessage | null): Promise<void> {
        if (!msg) return;

        const { userId, content } = JSON.parse(msg.content.toString());

        const user = await this.discordService.client.users.fetch(userId);
        if (user) {
            user.send(content);
        }

        this.channel.ack(msg);
    }
}