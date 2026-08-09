import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('users')
  createUser(@Body() body: { name: string; email: string; passwordHash: string }) {
    return this.appService.createUser(body);
  }
}
