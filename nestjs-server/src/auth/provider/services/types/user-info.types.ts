export type TypeUserInfo = {
    name: string
    picture: string
    email: string
    id:string
    access_token? : string | null
    refresh_token: string
    expires_at?: number
    provider: string
}