import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}
  getRoot(): Record<string, any> {
    return {
      version: this.configService.get('version'),
      description: this.configService.get('description'),
    };
  }
}
