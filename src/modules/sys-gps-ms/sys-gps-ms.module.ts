import { Module } from '@nestjs/common';
import { SysGpsMsService } from './sys-gps-ms.service';
import { SysGpsMsController } from './sys-gps-ms.controller';
import { SysGpsModule } from '../sys-gps/sys-gps.module';

@Module({
  imports: [SysGpsModule],
  controllers: [SysGpsMsController],
  providers: [SysGpsMsService],
})
export class SysGpsMsModule {}
