import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { SysGpsMsService } from './sys-gps-ms.service';
import { get } from 'lodash';

@Controller()
export class SysGpsMsController {
  constructor(private readonly sysGpsMsService: SysGpsMsService) {}
  @MessagePattern('gps-queue')
  async gpsQueue(@Payload() data: number[], @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const dataFromMessage = get(JSON.parse(get(originalMsg, 'content', '').toString()), 'data');
    await this.sysGpsMsService.create(dataFromMessage);
    console.info('gps-queue', dataFromMessage);
    channel.ack(originalMsg);
    return;
  }
}
