import { Test, TestingModule } from '@nestjs/testing';
import { OrderPayController } from './order-pay.controller';
import { OrderPayService } from './order-pay.service';

describe('OrderPayController', () => {
  let controller: OrderPayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderPayController],
      providers: [OrderPayService],
    }).compile();

    controller = module.get<OrderPayController>(OrderPayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
