export type GetAccessTokenRequest = {
    client_id: string
    client_secret: string
    grant_type: string
    code: string
    redirect_uri: string
}

export type RefreshTokenRequest = {
    client_id: string
    client_secret: string
    grant_type: string
    refresh_token: string
    redirect_uri: string
}