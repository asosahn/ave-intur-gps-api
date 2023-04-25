import { Module } from '@nestjs/common';
import { SysGpsService } from './sys-gps.service';
import { SysGpsController } from './sys-gps.controller';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import SysGps, { GpsSchema } from '../../database/models/sys_gps/gps.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SysGps.name,
        schema: GpsSchema,
        collection: 'sys_gps',
      },
    ]),
  ],
  controllers: [SysGpsController],
  providers: [
    SysGpsService,
    {
      inject: [ConfigService],
      provide: 'SYS_GPS_SERVICE',
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBIT_MQ')],
            queue: `gps-queue`,
            queueOptions: {
              durable: true,
            },
          },
        });
      },
    },
  ],
  exports: [SysGpsService, 'SYS_GPS_SERVICE'],
})
export class SysGpsModule {}
