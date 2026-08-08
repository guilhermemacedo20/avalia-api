import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('users')
  listUsers() {
    return this.appService.listUsers();
  }

  @Post('users')
  createUser(@Body() body: { name: string; email: string }) {
    return this.appService.createUser(body);
  }
}
