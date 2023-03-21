import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { MongooseModule } from '@nestjs/mongoose';
import Item, { ItemSchema } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Item.name,
        schema: ItemSchema,
        collection: 'item',
      },
    ]),
  ],
  providers: [ItemService],
  exports: [ItemModule, ItemService],
})
export class ItemModule {}
