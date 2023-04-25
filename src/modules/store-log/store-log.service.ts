import { Injectable } from '@nestjs/common';
import { CreateStoreLogDto } from './dto/create-store-log.dto';
import { UpdateStoreLogDto } from './dto/update-store-log.dto';
import { InjectModel } from '@nestjs/mongoose';
import StoreLog, { StoreLogDocument } from '../../database/models/storeLog/storeLog.schema';
import { Model } from 'mongoose';

@Injectable()
export class StoreLogService {
  constructor(@InjectModel(StoreLog.name) readonly storeLogModel: Model<StoreLogDocument>) {}
}
