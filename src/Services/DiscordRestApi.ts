import express, { Application, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { DiscordClientService } from './DiscordClientService';
import { InvalidRoute } from '../routes/InvalidRoute';
import { RedisHandler } from '../Handler/RedisHandler';

export class DiscordRestApi {
    private app: Application;
    private discordClientService: DiscordClientService;
    private redisClient: RedisHandler;

    constructor() {
        this.app = express();
        this.discordClientService = new DiscordClientService();
        this.redisClient = new RedisHandler();

        this.setupMiddleware();

        this.setupExpressRoutes();

        this.app.listen(process.env.PORT ?? 3000, () => console.log('Server is running on port 3000'));
    }

    private setupMiddleware() {
        this.app.use(express.json());
        this.app.use(helmet()); // Adds security headers

        // Rate limiting middleware
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
        });
        this.app.use(limiter);

        // Authentication middleware
        this.app.use(this.authenticate.bind(this));
    }

    private setupExpressRoutes() {

        this.app.get('/api/users', this.getUsers.bind(this));
        this.app.get('/api/user/:id', this.getUser.bind(this));

        this.app.get('/api/getUsersCount', this.getUsersCount.bind(this));

        this.app.post('/api/moveUser', this.moveUser.bind(this));
        this.app.post('/api/kickUserFromChannel', this.kickUserFromChannel.bind(this));

        // Add more routes for other actions (e.g., kicking users)

        this.app.use('*', InvalidRoute);
    }

    private async getUser(req: Request, res: Response) {
        const { quildId } = req.body;
        const userId = req.params.id;

        if (!userId) throw new Error('Invalid id param!');

        const redisKey = `guild:${quildId}:user:${userId}:data`;
        const cachedUser = await this.redisClient.client.get(redisKey);
        if (cachedUser) {
            res.json(cachedUser);
            return;
        }

        const member = await this.discordClientService.client.guilds.cache.get(quildId)?.members?.fetch(userId);

        if ( !member ) {
            res.json({ message: "Vituiks" });
            return;
        }

        const { id: memberId, displayName, roles: memberRoles } = member;
    }


    private async isUserUnderTwoWeeksOlds(req: Request, res: Response) { }

    private authenticate(req: Request, res: Response, next: NextFunction) {
        const apiKey = req.header('X-API-Key');
        if (apiKey === process.env.API_KEY) {
            next();
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    }

    private async getUsersCount(req: Request, res: Response): Promise<void> {
        const { quildId } = req.body;

        const redisKey = `guild:${quildId}:memberCount`;
        const cachedCount = await this.redisClient.client.get(redisKey);
        if (cachedCount) {
            res.json({ memberAmount: parseInt(cachedCount, 10) });
            return;
        }

        const guild = await this.discordClientService.client.guilds.fetch(quildId);
        const memberAmount = guild?.memberCount || 0;

        await this.redisClient.client.setEx(redisKey, 600, memberAmount.toString());

        res.json({ memberAmount: memberAmount });
    }

    private async getUsers(req: Request, res: Response) {
        const { quildId } = req.body;
        
        const redisKey = `guild:${quildId}:users`;
        const cachedUsers = await this.redisClient.client.get(redisKey);
        if ( cachedUsers ) {
            res.json(cachedUsers);
            return;
        }

        const guild = await this.discordClientService.client.guilds.fetch(quildId);
        const users = this.discordClientService.getUsers(guild);

        await this.redisClient.client.setEx(redisKey, 600, JSON.stringify(users));

        res.json(users);
    }

    private moveUser(req: Request, res: Response) {
        const { userId, channelId } = req.body;
        const guild = this.discordClientService.client.guilds.cache.first();
        const member = guild?.members.cache.get(userId);

        if (member) {
            this.discordClientService.moveUser(member, channelId)
                .then(() => res.json({ message: 'User moved successfully' }))
                .catch((error) => res.status(500).json({ message: 'Error moving user', error }));
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    }

    private kickUserFromChannel(req: Request, res: Response) {
        const { userId } = req.body;
        const guild = this.discordClientService.client.guilds.cache.first();

        res.status(404).json({ message: 'User not found' });
    }

}