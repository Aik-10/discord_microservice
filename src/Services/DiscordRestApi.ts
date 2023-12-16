import express, { Application, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { DiscordClientService } from './DiscordClientService';
import { InvalidRoute } from '../Routes/InvalidRoute';
import { RedisHandler } from '../Handler/RedisHandler';
import { generateApiResponse, ResponseStatus } from '../Utils/generateApiResponse';

export class DiscordRestApi {
    private app: Application;
    private discordClientService: DiscordClientService;
    private redisClient: RedisHandler;

    constructor() {
        this.app = express();
        this.discordClientService = new DiscordClientService();
        // this.redisClient = new RedisHandler();

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
        this.app.get('/api/channelUsers', this.channelUsers.bind(this));

        this.app.post('/api/moveUser', this.moveUser.bind(this));
        

        this.app.post('/api/kickUserFromChannel', this.kickUserFromChannel.bind(this));

        // Add more routes for other actions (e.g., kicking users)

        this.app.use('*', InvalidRoute);
    }

    private async getUser(req: Request, res: Response) {
        const { quildId } = req.body;
        const userId = req.params.id;

        if (!userId) throw new Error('Invalid id param!');

        /* const redisKey = `guild:${quildId}:user:${userId}:data`;
        const cachedUser = await this.redisClient.client.get(redisKey);
        if (cachedUser) {
            const response = await generateApiResponse(200, ResponseStatus.Success, cachedUser);
            res.status(response.responseCode).json(response);
            return;
        } */

        const guild = this.discordClientService.client.guilds.cache.get(quildId);
        if (!guild) {
            const response = await generateApiResponse(400, ResponseStatus.Error, "Invalid quildId param");
            res.status(response.responseCode).json(response);
            return;
        }

        const member = await guild.members?.fetch(userId);
        console.log(member)
        if (!member) {
            const response = await generateApiResponse(400, ResponseStatus.Error, "Invalid userId, or user doesnt find in guild");
            res.status(response.responseCode).json(response);
            return;
        }

        const { id: memberId, displayName, roles: memberRoles, joinedAt } = member;

        const userData = {
            id: memberId,
            name: displayName,
            roles: memberRoles.cache.map(({ id }) => id),
            avatarURL: member.displayAvatarURL(),
            joinedAt: joinedAt,
        };

        // await this.redisClient.client.setEx(redisKey, 60, JSON.stringify(userData));

        const response = await generateApiResponse(200, ResponseStatus.Success, userData);
        res.status(response.responseCode).json(response);
    }


    private async isUserUnderTwoWeeksOlds(req: Request, res: Response) { }

    private async authenticate(req: Request, res: Response, next: NextFunction) {
        const apiKey = req.header('X-API-Key');
        if (apiKey === process.env.API_KEY) {
            next();
        } else {
            const response = await generateApiResponse(401, ResponseStatus.Error, "Unauthorized");
            res.status(response.responseCode).json(response);
        }
    }

    private async getUsersCount(req: Request, res: Response): Promise<void> {
        const { quildId } = req.body;

        /* const redisKey = `guild:${quildId}:memberCount`;
        const cachedCount = await this.redisClient.client.get(redisKey);
        if (cachedCount) {
            const response = await generateApiResponse(200, ResponseStatus.Success, { memberAmount: parseInt(cachedCount, 10) });
            res.status(response.responseCode).json(response);
            return;
        }
 */     
        const guild = await this.discordClientService.client.guilds.cache.get(quildId);
        const memberAmount = guild?.memberCount || 0;

        // await this.redisClient.client.setEx(redisKey, 600, memberAmount.toString());

        const response = await generateApiResponse(200, ResponseStatus.Success, { memberAmount: memberAmount });
        res.status(response.responseCode).json(response);
    }

    private async getUsers(req: Request, res: Response) {
        const { quildId } = req.body;

        if (!quildId ) {
            const response = await generateApiResponse(400, ResponseStatus.Error, "Invalid quildId param");
            res.status(response.responseCode).json(response);
            return;
        }

        /* const redisKey = `guild:${quildId}:users`;
        const cachedUsers = await this.redisClient.client.get(redisKey);
        if (cachedUsers) {
            res.json(cachedUsers);
            return;
        } */

        const guild = this.discordClientService.client.guilds.cache.get(quildId);
        if (!guild ) {
            const response = await generateApiResponse(400, ResponseStatus.Error, "Invalid quildId param");
            res.status(response.responseCode).json(response);
            return;
        }

        const users = await this.discordClientService.getUsers(guild);

        // await this.redisClient.client.setEx(redisKey, 600, JSON.stringify(users));
        const response = await generateApiResponse(200, ResponseStatus.Success, users)
        res.status(response.responseCode).json(response);
    }

    private moveUser(req: Request, res: Response) {
        const { userId, channelId, quildId } = req.body;
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
    
    private async channelUsers(req: Request, res: Response) {
        const { channelId, quildId } = req.body;

        const guild = await this.discordClientService.client.guilds.cache.get(quildId);        
        const channel = guild?.channels.cache.get(channelId);

        if (!guild || !channel) {
            const response = await generateApiResponse(400, ResponseStatus.Error, "Invalid quildId param");
            res.status(response.responseCode).json(response);
            return;
        }

        const users = await this.discordClientService.getUsersInChannel(channel);


        const response = await generateApiResponse(200, ResponseStatus.Success, users);
        res.status(response.responseCode).json(response);       
    }

    private kickUserFromChannel(req: Request, res: Response) {
        const { userId } = req.body;
        const guild = this.discordClientService.client.guilds.cache.first();

        res.status(404).json({ message: 'User not found' });
    }

}