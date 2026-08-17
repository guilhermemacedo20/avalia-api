import {
  IsEmail,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { TrimAndLower } from 'src/common/helpers/email-validate.helper';

export class LoginDto {
  @IsEmail()
  @TrimAndLower()
  email!: string;

  @MinLength(8)
  @IsString()
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @TrimAndLower()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @TrimAndLower()
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'O código deve ter exatamente 6 caracteres.' })
  code!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
