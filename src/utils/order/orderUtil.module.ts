import { Module } from '@nestjs/common';
import { OrderServiceUtil } from './orderUtil.service';
import { UserModule } from '../user/user.module';
import { HttpModule } from '@nestjs/axios';
import { ItemModule } from '../item/item.module';

@Module({
  imports: [UserModule, HttpModule, ItemModule],
  providers: [OrderServiceUtil],
  exports: [OrderModuleUtils, OrderServiceUtil],
})
export class OrderModuleUtils {}
