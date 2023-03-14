import { Controller, Get } from '@nestjs/common';
import { PingService } from './ping.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ping')
@Controller('ping')
export class PingController {
  constructor(private readonly pingService: PingService) {}
  @Get()
  getPing(): Record<string, any> {
    return this.pingService.getPing();
  }
}
