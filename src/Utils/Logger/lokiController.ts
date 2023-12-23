import { createLogger, transports, format, Logger } from 'winston';
import LokiTransport from 'winston-loki';

import dotenv from 'dotenv';

export class LokiLogger {
    protected readonly logger: Logger;

    constructor() {
        dotenv.config();
        
        this.logger = createLogger({
            transports: [
                new LokiTransport({
                    host: `${process.env.LOGGER_HOST}`,
                    basicAuth: `${process.env.LOGGER_AUTH}`,
                    labels: { app: 'discord_microservice' },
                    json: true,
                    format: format.json(),
                    replaceTimestamp: true,
                    onConnectionError: (err) => console.error(err),
                }),
                new transports.Console({
                    format: format.combine(format.simple(), format.colorize()),
                }),
            ],
        });
    }

    public getLogger(): Logger {
        return this.logger;
    }
}