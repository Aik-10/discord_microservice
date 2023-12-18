type T = unknown;

type channelData = {
    id: string
    name: string
}

type userData = {
    id: string,
    username: string,
    tag: string,
    avatarURL: string,
    joinedAt?: Date | null,
    currentChannel?: channelData | null
}