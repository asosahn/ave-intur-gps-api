import { Test, TestingModule } from '@nestjs/testing';
import { OrderDetaillTemporalService } from './order-detaill-temporal.service';

describe('OrderDetaillTemporalService', () => {
  let service: OrderDetaillTemporalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderDetaillTemporalService],
    }).compile();

    service = module.get<OrderDetaillTemporalService>(OrderDetaillTemporalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
