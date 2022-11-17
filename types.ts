export interface Env {
    DB: D1Database,
    API_KEY: string
}

export interface UsersPayload {
    userId: string,
    username: string,
    language: string
}

export interface OutputPayload {
    userId: string,
    username: string,
    guildName: string,
    guildId: string,
    game: string,
    segment: string,
    language: string
    messageURL: string,
    imageURL: string
}