import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderOptionSymbol, TypeOptions } from './services/provider.constants';
import { BaseOAuthService } from './services/base-oauth.service';

@Injectable()
export class ProviderService implements OnModuleInit {
    public constructor(
        @Inject(ProviderOptionSymbol) private readonly options: TypeOptions
    ) {}
    onModuleInit() {
        for(const provider of this.options.services) {
            provider.baseUrl = this.options.baseUrl
        }
    }

    public findByService(service: string): BaseOAuthService | null {
        return this.options.services.find(s => s.name === service) ?? null
    }
}
