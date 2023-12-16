import { Client, Guild, GuildMember, GatewayIntentBits } from 'discord.js';

export class DiscordClientService {
    public client: Client;

    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildVoiceStates,
            ],
        });

        this.login();

        this.client.on('ready', () => this.onReady());
    }

    public async login(): Promise<void> {
        try {
            if (this.client.user) return;
            await this.client.login(process.env.CLIENT_TOKEN);
        } catch (error: any) {
            console.error('Login failed, retrying in 10 seconds...');
            console.error(error);
            setTimeout(() => this.login(), 10000);
        }
    }

    private onReady(): void {
        console.log(`Logged in as ${this.client.user?.tag}`);
    }

    public getUsers(guild: Guild): { username: string; id: string }[] {
        return guild?.members.cache.map((member) => ({
            username: member.user.username,
            id: member.id,
        })) || [];
    }

    public moveUser(member: GuildMember, channelId: string): Promise<GuildMember> {
        return member.voice.setChannel(channelId);
    }

    public moveUser(member: GuildMember, channelId: string): Promise<GuildMember> {
        return member.voice.setChannel(channelId);
    }


    // Add more methods for other actions (e.g., kicking users)
}