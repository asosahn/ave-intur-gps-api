import { Test, TestingModule } from '@nestjs/testing';
import { OrderDetaillController } from './order-detaill.controller';
import { OrderDetaillService } from './order-detaill.service';

describe('OrderDetaillController', () => {
  let controller: OrderDetaillController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderDetaillController],
      providers: [OrderDetaillService],
    }).compile();

    controller = module.get<OrderDetaillController>(OrderDetaillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
