import { Test, TestingModule } from '@nestjs/testing';
import { OrderDetaillTemporalController } from './order-detaill-temporal.controller';
import { OrderDetaillTemporalService } from './order-detaill-temporal.service';

describe('OrderDetaillTemporalController', () => {
  let controller: OrderDetaillTemporalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderDetaillTemporalController],
      providers: [OrderDetaillTemporalService],
    }).compile();

    controller = module.get<OrderDetaillTemporalController>(OrderDetaillTemporalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
