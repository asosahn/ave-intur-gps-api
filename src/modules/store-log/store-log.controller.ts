import { Controller } from '@nestjs/common';
import { StoreLogService } from './store-log.service';

@Controller('store-log')
export class StoreLogController {
  constructor(private readonly storeLogService: StoreLogService) {}
}
