import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    public constructor(private readonly userService: UserService) {}

    public async canActivate( context: ExecutionContext, ):Promise<boolean> {
        const request = context.switchToHttp().getRequest()

        if(typeof request.session.userId === 'undefined') {
            throw new UnauthorizedException(
                'User is not authenticated. Please log in to access this resource.'
            )
        }

        const user = await this.userService.findById(request.session.userId)

        request.user = user

        return true
    }
}