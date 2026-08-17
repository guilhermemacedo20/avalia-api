import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { generateCode } from 'src/common/utils/code';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(userLogin: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: userLogin.email,
      },
    });
    const invalidLogin =
      !user || !(await bcrypt.compare(userLogin.password, user.password));

    if (invalidLogin) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const acessToken = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      acessToken,
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

    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

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
        code: hashedCode,
        expiresAt: expirationTime,
      },
      update: {
        code: hashedCode,
        expiresAt: expirationTime,
        usedAt: null,
      },
    });

    //TO-DO: Remover console.log e implementar envio de e-mail com o código para o usuário
    console.log(`Código de redefinição de senha: ${code}`);

    return { message };
  }

  async resetPassword(data: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

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

    const validCode = await bcrypt.compare(data.code, token.code);

    const passwordHashed = await bcrypt.hash(data.newPassword, 10);

    if (!validCode) {
      throw new UnauthorizedException(errorMessage);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: passwordHashed, mustChangePassword: false },
      }),
      this.prisma.passwordResetToken.update({
        where: { userId: user.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso.' };
  }

  async me(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }
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
