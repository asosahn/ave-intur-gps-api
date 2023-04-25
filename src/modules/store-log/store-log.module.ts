import { Module } from '@nestjs/common';
import { StoreLogService } from './store-log.service';
import { StoreLogController } from './store-log.controller';
import { MongooseModule } from '@nestjs/mongoose';
import StoreLog, { StoreLogSchema } from '../../database/models/storeLog/storeLog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StoreLog.name,
        schema: StoreLogSchema,
        collection: 'store_log',
      },
    ]),
  ],
  controllers: [StoreLogController],
  providers: [StoreLogService],
  exports: [StoreLogService],
})
export class StoreLogModule {}
