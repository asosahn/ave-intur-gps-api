import { Test, TestingModule } from '@nestjs/testing';
import { OrderDetaillService } from './order-detaill.service';

describe('OrderDetaillService', () => {
  let service: OrderDetaillService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderDetaillService],
    }).compile();

    service = module.get<OrderDetaillService>(OrderDetaillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
