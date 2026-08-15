import { IsEmail, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  @IsString()
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'O código deve ter pelo menos 6 caracteres' })
  @MaxLength(6, { message: 'O código deve ter no máximo 6 caracteres' })
  code!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
