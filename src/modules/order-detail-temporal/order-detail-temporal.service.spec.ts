import { Test, TestingModule } from '@nestjs/testing';
import { OrderDetailTemporalService } from './order-detail-temporal.service';

describe('OrderDetailTemporalService', () => {
  let service: OrderDetailTemporalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderDetailTemporalService],
    }).compile();

    service = module.get<OrderDetailTemporalService>(OrderDetailTemporalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
