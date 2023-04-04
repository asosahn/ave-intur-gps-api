import { Test, TestingModule } from '@nestjs/testing';
import { OrderDetailTemporalController } from './order-detail-temporal.controller';
import { OrderDetailTemporalService } from './order-detail-temporal.service';

describe('OrderDetailTemporalController', () => {
  let controller: OrderDetailTemporalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderDetailTemporalController],
      providers: [OrderDetailTemporalService],
    }).compile();

    controller = module.get<OrderDetailTemporalController>(OrderDetailTemporalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
