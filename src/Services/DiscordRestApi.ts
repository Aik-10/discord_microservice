import express, { Application, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import '../Utils/Sentry'
import { DiscordClientService } from './DiscordClientService';
import { InvalidRoute } from '../Routes/InvalidRoute';
import { generateApiResponse, ResponseStatus, Response as DefaultResponse } from '../Routes/Middlewares/Response';
import { Authenticate } from '../Routes/Middlewares/Auth';
import { GuildError } from '../Errors/GuildError';
import { UsersIdError } from '../Errors/UsersIdError';
import { UsersError } from '../Errors/UsersError';
import { ChannelError } from '../Errors/ChannelError';
import { ChannelIsTextBasedError } from '../Errors/ChannelIsTextBasedError';
import { RedisHandler } from '../Handler/RedisHandler';
import { getLogger } from '../Utils/Logger/lokiInitializer';

import * as Sentry from '@sentry/node';

export class DiscordRestApi {

    private app: Application;
    private discordClientService: DiscordClientService;
    protected redisClient: RedisHandler;
    protected logger;

    private readonly defaultResponse: DefaultResponse;

    constructor() {
        this.app = express();
        this.discordClientService = new DiscordClientService();
        this.redisClient = new RedisHandler();
        this.logger = getLogger();
        this.defaultResponse = generateApiResponse(400, ResponseStatus.Fail, "Invalid to get response!");

        this.setupMiddleware();

        this.setupExpressRoutes();
        const port = process.env.PORT ?? 3000;
        this.app.listen(port, () => { 
            this.logger.info(`Server is running on port ${port}`);
            Sentry.setupExpressErrorHandler(this.app)
         });

        (async() => {
            await this.redisClient.client.connect();
        })();
    }

    private setupMiddleware() {

        this.app.use(express.json());
        this.app.use(helmet()); // Adds security headers

        // Rate limiting middleware
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: parseInt(`${process.env.API_RATELIMIT_MAX}`) ?? 100, // Limit each IP to 100 requests per windowMs
        });

        this.app.use(limiter);
        this.app.use(morgan('[:date[web]] :method :url :status :res[content-length] - :response-time ms ":user-agent"'));

        // Authentication middleware
        this.app.use(Authenticate);
    }

    private setupExpressRoutes() {
        /* GET */
        this.app.get('/api/users', this.getUsers.bind(this));
        this.app.get('/api/user/:id', this.getUser.bind(this));

        this.app.get('/api/getUsersCount', this.getUsersCount.bind(this));
        this.app.get('/api/channelUsers', this.channelUsers.bind(this));

        /* POST */
        this.app.post('/api/kickUserInVoice/:id', this.kickUserInVoice.bind(this));
        this.app.post('/api/moveUser/:id', this.moveUser.bind(this));

        this.app.use('*', InvalidRoute);
    }

    private async kickUserInVoice(req: Request, res: Response): Promise<void> {
        let response = this.defaultResponse;

        try {
            const { quildId } = req.body;
            const userId = req.params.id;

            if (!quildId) throw new GuildError();
            if (!userId) throw new UsersIdError();

            const guild = await this.discordClientService.client.guilds.fetch(quildId) || (() => { throw new GuildError(); })();
            const member = await guild.members.fetch(userId) || (() => { throw new UsersError(); })();
            if (!member.voice?.channelId) throw new UsersError();

            await this.discordClientService.kickUserInVoice(member);

            response = await generateApiResponse(200, ResponseStatus.Success, "User disconnected!");
        } catch (error: GuildError | UsersIdError | UsersError | any) {
            this.logger.error(error);
            response = await generateApiResponse(400, ResponseStatus.Error, error instanceof Error ? error.message : error?.message);
        } finally {
            res.status(response.responseCode).json(response);
        }
    }

    private async getUser(req: Request, res: Response) {
        let response = this.defaultResponse;

        try {
            const { quildId } = req.body;
            const userId = req.params.id;

            if (!quildId) throw new GuildError();
            if (!userId) throw new UsersIdError();

            const redisKey = `guild:${quildId}:user:${userId}:data`;
            const cachedUser = await this.redisClient.client.get(redisKey);
            if (cachedUser) {
                response = await generateApiResponse(200, ResponseStatus.Success, JSON.parse(cachedUser));
                return;
            }

            const guild = this.discordClientService.client.guilds.cache.get(quildId) || (() => { throw new GuildError(); })();
            const member = await guild?.members.fetch(userId) || (() => { throw new UsersError(); })();

            const { id: memberId, displayName, roles: memberRoles, joinedAt, voice } = member;

            const userData = {
                id: memberId,
                name: displayName,
                roles: memberRoles.cache.map(({ id }) => id),
                avatarURL: member.displayAvatarURL(),
                joinedAt: joinedAt,
                createdAt: member.user.createdAt,
                isUserUnderTwoWeeksOld: member.user.createdAt > new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000),
                currentChannel: {
                    id: voice?.channel?.id,
                    name: voice?.channel?.name,
                }
            };

            await this.redisClient.client.setEx(redisKey, 60, JSON.stringify(userData));

            response = await generateApiResponse(200, ResponseStatus.Success, userData);
        } catch (error: GuildError | UsersIdError | UsersError | any) {
            this.logger.error(error);
            response = await generateApiResponse(400, ResponseStatus.Error, error instanceof Error ? error.message : error?.message);
        } finally {
            res.status(response.responseCode).json(response);
        }
    }

    private async getUsersCount(req: Request, res: Response): Promise<void> {
        let response = this.defaultResponse;

        try {
            const { quildId } = req.body;

            if (!quildId) throw new GuildError();
            const redisKey = `guild:${quildId}:memberCount`;
            const cachedMemberCount = await this.redisClient.client.get(redisKey);
            if (cachedMemberCount) {
                response = await generateApiResponse(200, ResponseStatus.Success, { memberAmount: cachedMemberCount });
                return;
            }
            const guild = await this.discordClientService.client.guilds.fetch(quildId) || (() => { throw new GuildError(); })();
            const memberAmount = guild?.memberCount || 0;

            await this.redisClient.client.setEx(redisKey, 600, memberAmount.toString());

            response = await generateApiResponse(200, ResponseStatus.Success, { memberAmount: memberAmount });
        } catch (error: GuildError | UsersIdError | UsersError | any) {
            this.logger.error(error);
            response = await generateApiResponse(400, ResponseStatus.Error, error instanceof Error ? error.message : error?.message);
        } finally {
            res.status(response.responseCode).json(response);
        }
    }

    private async getUsers(req: Request, res: Response): Promise<void> {
        let response = this.defaultResponse;

        try {
            const { quildId } = req.body;

            if (!quildId) throw new GuildError();

            const redisKey = `guild:${quildId}:users`;
            const cachedUsers = await this.redisClient.client.get(redisKey);
            if (cachedUsers) {
                response = await generateApiResponse(200, ResponseStatus.Success, JSON.parse(cachedUsers));
                return;
            }

            const guild = await this.discordClientService.client.guilds.fetch(quildId) || (() => { throw new GuildError(); })();
            const users = await this.discordClientService.getUsers(guild);

            await this.redisClient.client.setEx(redisKey, 600, JSON.stringify(users));

            response = await generateApiResponse(200, ResponseStatus.Success, users);
        } catch (error: GuildError | any) {
            this.logger.error(error);
            response = await generateApiResponse(400, ResponseStatus.Error, error instanceof Error ? error.message : error?.message);
        } finally {
            res.status(response.responseCode).json(response);
        }
    }

    private async moveUser(req: Request, res: Response): Promise<void> {
        let response = this.defaultResponse;

        try {
            const { channelId, quildId } = req.body;
            const userId = req.params.id;

            if (!quildId) throw new GuildError();
            if (!channelId) throw new ChannelError();
            if (!userId) throw new UsersIdError();

            const guild = await this.discordClientService.client.guilds.fetch(quildId) || (() => { throw new GuildError(); })();
            const member = await guild.members.fetch(userId) || (() => { throw new UsersError(); })();

            await guild.channels.fetch(channelId) || (() => { throw new ChannelError(); })();

            await this.discordClientService.moveUser(member, channelId);

            response = await generateApiResponse(200, ResponseStatus.Success, { message: 'User moved successfully' });
        } catch (error: GuildError | ChannelError | UsersIdError | UsersError | any) {
            this.logger.error(error);
            response = await generateApiResponse(400, ResponseStatus.Error, error instanceof Error ? error.message : error?.message);
        } finally {
            res.status(response.responseCode).json(response);
        }
    }

    /* Redis cache not use here, because we wanna realtime data. */
    private async channelUsers(req: Request, res: Response): Promise<void> {
        let response = this.defaultResponse;

        try {
            const { channelId, quildId } = req.body;

            if (!quildId) throw new GuildError();
            if (!channelId) throw new ChannelError();

            const guild = await this.discordClientService.client.guilds.fetch(quildId) || (() => { throw new GuildError(); })();
            const channel = await guild?.channels.fetch(channelId) || (() => { throw new ChannelError(); })();
            const users = await this.discordClientService.getUsersInChannel(channel);

            response = await generateApiResponse(200, ResponseStatus.Success, users);
        } catch (error: GuildError | ChannelIsTextBasedError | ChannelError | any) {
            this.logger.error(error);
            response = await generateApiResponse(400, ResponseStatus.Error, error instanceof Error ? error.message : error?.message);
        } finally {
            res.status(response.responseCode).json(response);
        }
    }
}