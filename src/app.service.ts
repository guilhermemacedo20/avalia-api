import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  listUsers() {
    return this.prisma.user.findMany();
  }

  createUser(data: { name: string; email: string }) {
    const passwordHash = 'hashed_password';
    return this.prisma.user.create({ data: { ...data, passwordHash } });
  }
}
