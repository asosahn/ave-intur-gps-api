import { Module } from '@nestjs/common';
import { OrderDetaillService } from './order-detaill.service';
import { OrderDetaillController } from './order-detaill.controller';

@Module({
  controllers: [OrderDetaillController],
  providers: [OrderDetaillService]
})
export class OrderDetaillModule {}
