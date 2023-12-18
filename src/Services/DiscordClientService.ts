import { ChannelIsTextBasedError } from '../Errors/ChannelIsTextBasedError';
import { Client, Guild, GuildMember, GatewayIntentBits, GuildBasedChannel, Collection, VoiceBasedChannel } from 'discord.js';

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

            if (error?.code === "TokenInvalid") {
                console.error('Login failed, Invalid bot token!');
                return;
            }

            console.error(error);
            setTimeout(() => this.login(), 10000);
        }
    }

    private onReady(): void {
        console.log(`Logged in as ${this.client.user?.tag}`);
    }

    public async getUsers(guild: Guild): Promise<userData[]> {
        const members = await guild.members.fetch();
        return await this.getMemberData(members);
    }

    public async getUsersInChannel(channel: GuildBasedChannel): Promise<userData[]> {
        if (!channel?.isVoiceBased()) {
            throw new ChannelIsTextBasedError();
        }

        return await this.getMemberData(channel?.members);
    }

    public async moveUser(member: GuildMember, channelId: string): Promise<GuildMember> {
        return await member.voice.setChannel(channelId);
    }

    public async kickUserInVoice(member: GuildMember): Promise<void> {
        await member.voice.disconnect();
    }

    private async getMemberData(members: Collection<string, GuildMember>): Promise<userData[]> {
        return await members?.map((member) => ({
            id: member.id,
            username: member.user.username,
            tag: member.user.tag,
            avatarURL: member.displayAvatarURL(),
            joinedAt: member.joinedAt,
            currentChannel: this.getMemberChannelData(member?.voice.channel)
        })) || [];
    }

    private getMemberChannelData(channel: VoiceBasedChannel | null): channelData | null {
        if (!channel) return null;

        return {
            id: channel.id,
            name: channel.name
        }
    }

}