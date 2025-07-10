import { IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UpdateUserDto {
    @IsString({ message: 'Name require a string.' })
    @IsNotEmpty({ message: 'Name require to fill' })
    name: string

    @IsString({ message: 'Email require a string.' })
    @IsEmail({}, { message: 'uncorrect format email' })
    @IsNotEmpty({ message: 'Email require to fill' })
    email: string

    @IsBoolean({ message: 'isTwoFactorEnbled need to be boolean value' })
    isTwoFactorEnabled: boolean
}