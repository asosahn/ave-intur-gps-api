import { Injectable } from '@nestjs/common';
import Item, {
  ItemDocument,
  ItemModelExt,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.schema';
import { InjectModel } from '@nestjs/mongoose';
import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import ItemAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.entity';
import { Types } from 'mongoose';
import {
  buildQuery,
  select,
  where,
} from '@albatrosdeveloper/ave-utils-npm/lib/utils/query.util';

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name)
    private readonly itemModel: ItemModelExt<ItemDocument>,
  ) {}

  /**
   * Find items for an order
   * @param order
   */
  async findItemsForOrder(
    order: Partial<OrderAttributes | any>,
  ): Promise<Partial<ItemAttributes>[]> {
    try {
      const ids = order.orderDetails.map(
        (item) => new Types.ObjectId(item.item?._id),
      );
      console.log(order.orderDetails);
      const warehouseId = new Types.ObjectId(order.warehouse?._id);
      const data = await this.itemModel
        // Use MongoDB's aggregation framework to filter and modify the results of the query
        .aggregate([
          // Filter for items whose IDs match the IDs of items in the order
          {
            $match: {
              _id: { $in: ids },
              'warehouseItem.warehouse._id': warehouseId,
              _deleted: false,
              active: '1',
            },
          },
          // Modify the result set to include only the warehouse item matching the order's warehouse
          {
            $addFields: {
              warehouseItem: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$warehouseItem',
                      as: 'item',
                      cond: {
                        $eq: ['$$item.warehouse._id', warehouseId],
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
        ])
        // Allow MongoDB to use disk space if necessary for the query
        .allowDiskUse(true)
        // Specify that the query should read from a secondary node in a replica set if possible
        .read('secondaryPreferred')
        // Execute the query and return the result
        .exec();
      return data;
    } catch (error) {
      // If an error occurs, throw it back to the caller
      throw error;
    }
  }
}
