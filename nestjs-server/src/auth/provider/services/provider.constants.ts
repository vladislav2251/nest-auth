import { FactoryProvider, ModuleMetadata } from "@nestjs/common"
import { BaseOAuthService } from "./base-oauth.service"

export const ProviderOptionSymbol = Symbol()

export type TypeOptions = {
    baseUrl: string
    services: BaseOAuthService[]
}

export type TypeAsyncOptions = Pick<ModuleMetadata, 'imports'> &
    Pick<FactoryProvider<TypeOptions>, 'useFactory' | 'inject'>