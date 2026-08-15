import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { generateCode } from 'src/common/utils/code';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(userLogin: LoginDto) {
    const email = userLogin.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    const invalidLogin =
      !user || !(await bcrypt.compare(userLogin.password, user.passwordHash));

    if (invalidLogin) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        registrationNumber: user.registrationNumber,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async forgotPassword(data: ForgotPasswordDto) {
    const expirationTime = new Date(Date.now() + 20 * 60 * 1000);
    const email = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    const message =
      'Se o e-mail existir, enviaremos um código para redefinir a senha.';

    if (!user) {
      return { message };
    }

    const code = generateCode(6);

    const hashedCode = await bcrypt.hash(code, 10);

    await this.prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        codeHash: hashedCode,
        expiresAt: expirationTime,
      },
      update: {
        codeHash: hashedCode,
        expiresAt: expirationTime,
        usedAt: null,
      },
    });

    //TO-DO: Remover console.log e implementar envio de e-mail com o código para o usuário
    console.log(`Código de redefinição de senha: ${code}`);

    return { message };
  }

  async resetPassword(data: ResetPasswordDto) {
    const email = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    const errorMessage = 'Código inválido, expirado ou já utilizado.';

    if (!user) {
      throw new UnauthorizedException(errorMessage);
    }

    const token = await this.prisma.passwordResetToken.findUnique({
      where: { userId: user.id },
    });

    if (!token || token?.usedAt || token.expiresAt <= new Date()) {
      throw new UnauthorizedException(errorMessage);
    }

    const validCode = await bcrypt.compare(data.code, token.codeHash);

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    if (!validCode) {
      throw new UnauthorizedException(errorMessage);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false },
      }),
      this.prisma.passwordResetToken.update({
        where: { userId: user.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso.' };
  }
}
