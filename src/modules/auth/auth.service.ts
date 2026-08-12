import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/password-reset.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async loginUser(data: LoginDto) {
    const email = data.email;

    const user = await this.prisma.user.findUnique({ where: { email } });

    const invalid =
      !user || !(await bcrypt.compare(data.password, user.passwordHash));

    if (invalid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.mustChangePassword) {
      throw new ForbiddenException(
        'Defina sua senha pela aba de Esqueci minha senha',
      );
    }

    const accessToken = this.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        registrationNumber: user.registrationNumber,
      },
    };
  }

  async forgotPassword(emailReq: string) {
    const email = emailReq;
    const user = await this.prisma.user.findUnique({ where: { email } });

    const message =
      'Se o e-mail existir, enviaremos um código para redefinir a senha.';

    if (!user) {
      return { message };
    }

    // await this. TO-DO: Realizar lógica do envio de e-mail com o código de redefinição de senha
    const userId = user.id;
    console.info(`Código de redefinição de senha para o usuário ${userId}:`);
    // await this.prisma.passwordResetToken.upsert({
    //   where: { userId },
    //   create: { userId, codeHash, expiresAt },
    //   update: {
    //     codeHash,
    //     expiresAt,
    //     usedAt: null,
    //   },
    // });
    return { message };
  }

  async resetPassword(data: ResetPasswordDto) {
    const email = data.email;
    const user = await this.prisma.user.findUnique({ where: { email } });

    const errorMessage = 'Código inválido ou expirado';

    if (!user) {
      throw new UnauthorizedException(errorMessage);
    }

    const token = await this.prisma.passwordResetToken.findUnique({
      where: { userId: user.id },
    });

    if (!token || token.expiresAt <= new Date()) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    const validCode = await bcrypt.compare(data.code, token.codeHash);

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    if (!validCode) {
      throw new UnauthorizedException('Código inválido ou expirado');
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

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        registrationNumber: true,
        mustChangePassword: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }
}
