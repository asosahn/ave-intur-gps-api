import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

@Injectable()
export class PingService {
  constructor(private readonly configService: ConfigService) {}

  getPing(): Record<string, any> {
    return {
      ping: 'pong',
      name: this.configService.get('name'),
      version: this.configService.get('version'),
      description: this.configService.get('description'),
      uptime: process.uptime(),
      hostname: os.hostname(),
      platform: os.platform(),
      environment: process.env.NODE_ENV,
      // networks: os.networkInterfaces(),
    };
  }
}
