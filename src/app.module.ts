import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PingModule } from './modules/ping/ping.module';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderLogModule } from './modules/order-log/order-log.module';
import { OrderDetailTemporalModule } from './modules/order-detail-temporal/order-detail-temporal.module';
import { OrderDetailModule } from './modules/order-detail/order-detail.module';
import { OrderPayModule } from './modules/order-pay/order-pay.module';
import { OrderModule } from './modules/order/order.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_DATABASE,
      }),
    }),
    PingModule,
    OrderLogModule,
    OrderDetailTemporalModule,
    OrderDetailModule,
    OrderPayModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
