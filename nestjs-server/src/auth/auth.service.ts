import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '@/user/user.service';
import { AuthMethod, User } from 'prisma/__generated__';
import { Request } from 'express';

@Injectable()
export class AuthService {
    public constructor(private readonly userService: UserService) {}

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

    public async login() {}

    public async logout() {}

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
