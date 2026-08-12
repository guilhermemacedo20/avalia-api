import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
