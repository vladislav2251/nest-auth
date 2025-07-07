import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { User } from "prisma/__generated__";

export const Authorized = createParamDecorator(
    (data: keyof User, ctx: ExecutionContextHost) => {
        const request = ctx.switchToHttp().getRequest()
        const user = request.user
        return data ? user[data] : user
    }
)