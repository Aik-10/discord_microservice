import amqp from 'amqplib';

export class RabbitMQtest {
    private amqpConnection: amqp.Connection;
    private amqpChannel: amqp.Channel;

    constructor() {
        this.initializeRabbitMQ();
    }

    private async initializeRabbitMQ() {
        if (!process.env.QUEUE_CONNECT) return;
        
        this.amqpConnection = await amqp.connect(process.env.QUEUE_CONNECT);
        this.amqpChannel = await this.amqpConnection.createChannel();

        // Create a queue for private messages
        const queueName = process.env.QUEUE_NAME ?? 'private_messages';
        await this.amqpChannel.assertQueue(queueName, { durable: false });
    }

    public publishMessageToQueue(userId: string, content: string) {
        const queueName = process.env.QUEUE_NAME ?? 'private_messages';
        const message = { userId, content };

        // Send the message to the RabbitMQ queue
        this.amqpChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
    }
}