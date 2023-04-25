import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PingModule } from './modules/ping/ping.module';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { SysGpsModule } from './modules/sys-gps/sys-gps.module';
import { OrderLogModule } from './modules/order-log/order-log.module';
import { StoreLogModule } from './modules/store-log/store-log.module';
import { SysGpsMsModule } from './modules/sys-gps-ms/sys-gps-ms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_DATABASE'),
      }),
    }),
    PingModule,
    SysGpsModule,
    OrderLogModule,
    StoreLogModule,
    SysGpsMsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
