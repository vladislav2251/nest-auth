import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '@/user/user.service';
import { AuthMethod, User } from 'prisma/__generated__';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { ProviderService } from './provider/provider.service';

@Injectable()
export class AuthService {
    public constructor(
            private readonly userService: UserService,
            private readonly configService: ConfigService,
            private readonly prismaService: PrismaService,
            private readonly providerService: ProviderService
        ) {}

    public async register(req: Request, dto: RegisterDto) {
        const isExists = await this.userService.findByEmail(dto.email);

        if (isExists) {
            throw new ConflictException(
                'A user with this email already exists.'
            );
        }

        const newUser = await this.userService.create(
            dto.email,
            dto.password,
            dto.name,
            '',
            AuthMethod.CREDENTIALS,
            false
        );

        return this.saveSession(req, newUser);
    }

    public async login(req: Request, dto: LoginDto) {
        const user = await this.userService.findByEmail(dto.email)

        if (!user || !user.password) {
            throw new NotFoundException(
                'User not found or registration incomplete'
            )
        }

        const isValidPassword = await verify(user.password, dto.password)

        if (!isValidPassword) {
            throw new UnauthorizedException(
                'Invalid password. Please try again or use the password recovery option'
            )
        }

        return this.saveSession(req, user)
    }

    public async extractProfileFromCode(
        req: Request,
        provider: string,
        code: string
    ) {
        const providerInstance = this.providerService.findByService(provider);

        if (!providerInstance) {
            throw new NotFoundException('Провайдер не найден');
        }

        const profile = await providerInstance.findUserByCode(code);

        const { email, name, picture, provider: providerName, id, access_token, refresh_token, expires_at } = profile;

        if (!email || !name || !providerName) {
            throw new InternalServerErrorException('Профиль не содержит обязательных данных');
        }

        const account = await this.prismaService.account.findFirst({
            where: {
                id,
                provider: providerName
            }
        });

        let user = account?.userId
            ? await this.userService.findById(account.userId)
            : null;

        if (!user) {
            user = await this.userService.create(
                email,
                '',
                name,
                picture,
                AuthMethod[providerName.toUpperCase() as keyof typeof AuthMethod],
                true
            );
        }

        if (!account) {
            if (!expires_at) {
                throw new InternalServerErrorException('Нет времени истечения access токена');
            }

            await this.prismaService.account.create({
                data: {
                    userId: user.id,
                    type: 'oauth',
                    provider: providerName,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                    expiresAt: expires_at
                }
            });
        }

        return this.saveSession(req, user);
    }


    public async logout(req: Request, res: Response):Promise<void> {
        return new Promise((resolve, reject) => {
            req.session.destroy(err => {
                if(err) {
                    return reject(
                        new InternalServerErrorException(
                            'не удаолось завершить сессии возможно возникла пробоеа на сервере или сессия уже была хавершина'
                        )
                    )
                }
                res.clearCookie(
                    this.configService.getOrThrow<string>('SESSION_NAME')
                )
                resolve()
            })
        })
    }

    private async saveSession(req: Request, user: User) {
        return new Promise((resolve, reject) => {
            req.session.userId = user.id;

            req.session.save(err => {
                if (err) {
                    console.log(err)
                    return reject(
                        new InternalServerErrorException(
                            'Failed to create session. Please check session configuration.'
                        )
                    );
                }

                resolve({ user });
            });
        });
    }
}
