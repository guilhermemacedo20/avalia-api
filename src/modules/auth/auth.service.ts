import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(userLogin: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: userLogin.email,
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
        mustChangePassword: user.mustChangePassword
      },
    };
  }
}
