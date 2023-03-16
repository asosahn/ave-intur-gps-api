import { Module } from '@nestjs/common';
import { OrderDetaillService } from './order-detaill.service';
import { OrderDetaillController } from './order-detaill.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrderDetaillController],
  providers: [OrderDetaillService],
  exports: [OrderDetaillService]
})
export class OrderDetaillModule { }
