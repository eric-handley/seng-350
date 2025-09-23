import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    return this.appService.getHealthCheck();
  }

  @Get('cache/:key')
  async getCacheTest(@Param('key') key: string) {
    return this.appService.getCachedData(key);
  }
}