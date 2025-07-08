import { BadRequestException, Injectable, Post, UnauthorizedException } from "@nestjs/common";
import { TypeBaseProviderOptions } from "./types/base-provider.options.types";
import { TypeUserInfo } from "./types/user-info.types";

@Injectable()
export class BaseOAuthService {
    public BASE_URL: string

    public constructor(private readonly options: TypeBaseProviderOptions) {}

    protected async extractUserInfo(data: any): Promise<TypeUserInfo> {
        return {
            ...data,
            provider: this.options.name
        }
    }

    public getAuthUrl() {
        const query = new URLSearchParams({
            response_type: 'code',
            client_id: this.options.cliend_id,
            redirect_uri: this.getRedirectUrl(),
            scopr: (this.options.scopes ?? []).join(' '),
            access_type: 'offline',
            promt: 'select_account'
        })

        return `${this.options.authorize_url}?${query}`
    }

    public async findUserByCode(code: string): Promise<TypeUserInfo> {
        const cliend_id = this.options.cliend_id
        const client_secret = this.options.client_secret

        const tokenQuery = new URLSearchParams({
            cliend_id,
            client_secret,
            redirect_uri: this.getRedirectUrl(),
            grand_type: 'authorization_code'
        })

        const tokenRequest = await fetch(this.options.access_url, {
            method: 'POST',
            body: tokenQuery,
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
            }
        })

        const tokenResponse = await tokenRequest.json()

        if(!tokenResponse.ok) {
            throw new BadRequestException(
                `Не удалось получить пользователя с ${this.options.profile_url}. Проверьте правильность токена доступа`
            )
        }

        if(!tokenResponse.access_token) {
            throw new BadRequestException(
                `Нет токета с ${this.options.access_url}. Убедитесь что код авторизации действителен`
            )
        }

        const userRequest = await fetch(this.options.profile_url, {
            headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`
            }
        })

        if(!userRequest.ok) {

            throw new UnauthorizedException(
                `Не удалось получить пользователя с ${this.options.profile_url}. Проверьте правильность токена доступаю`
            )
        }

        const user = await userRequest.json()
        const userData = await this.extractUserInfo(user)

        return {
            ...userData,
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            expires_at: tokenResponse.expires_at || tokenResponse.expires_in,
            provider: this.options.name
        }

    }

    public getRedirectUrl() {
        return `${this.BASE_URL}/auth/oauth/callback/${this.options.name}`
    }

    set BaseUrl(value: string) {
        this.BASE_URL = value
    }

    get name() {
        return this.options.name
    }

    get access_url() {
        return this.options.access_url
    }

    get profile_url() {
        return this.options.profile_url
    }

    get scopes() {
        return this.options.scopes
    }
}