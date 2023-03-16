import { Test, TestingModule } from '@nestjs/testing';
import { OrderPayService } from './order-pay.service';

describe('OrderPayService', () => {
  let service: OrderPayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderPayService],
    }).compile();

    service = module.get<OrderPayService>(OrderPayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
