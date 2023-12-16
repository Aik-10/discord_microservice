import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';

export class RabbitMQHandler {
    private channel: Channel;

    constructor() {
        this.setupRabbitMQ();
    }

    private async setupRabbitMQ() {
        const connection = await amqp.connect('amqp://localhost');
        this.channel = await connection.createChannel();

        const queueName = 'private_messages';
        await this.channel.assertQueue(queueName, { durable: false });

        this.channel.consume(queueName, this.handlePrivateMessage.bind(this));
    }

    private handlePrivateMessage(msg: ConsumeMessage | null) {
        if (msg) {
            const { userId, message } = JSON.parse(msg.content.toString());
            /* const user = DiscordRestApi.client.users.cache.get(userId);

            if (user) {
                user.send(message);
            } */

            this.channel.ack(msg);
        }
    }
}