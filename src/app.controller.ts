import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('main')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get()
  getRoot(): Record<string, any> {
    return this.appService.getRoot();
  }
}
