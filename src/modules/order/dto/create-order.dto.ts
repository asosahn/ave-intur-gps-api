import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsBoolean,
  IsOptional,
  IsObject,
  IsDate,
  IsDecimal,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import AddressAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/address/address.entity';
import { Types } from 'mongoose';
import OrderAttributes, {
  OrderCourierAttributes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import UserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.entity';
import BusinessPartnerAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/businessPartner/businessPartner.entity';
import WarehouseAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/warehouse/warehouse.entity';
import OrderTypeAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderType/orderType.entity';
import { CreateOrderDetaillDto } from 'src/modules/order-detaill/dto/create-order-detaill.dto';
import OrderDetaillAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetaill/orderDetaill.entity';

class UserDto {
  @ApiProperty({
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  legalAcceptance: boolean;

  @ApiProperty({
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  iisPrincipal: boolean;

  @ApiProperty({
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active: string;

  @ApiProperty({
    required: true,
  })
  @Type(() => UserLogin)
  @IsNotEmpty()
  userLogin: UserLogin;
}

class UserLogin {
  @ApiProperty({
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName: string;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({
    required: false,
  })
  @IsObject()
  @IsOptional()
  groupPermissions: Record<string, any>;
}

class UserAddress extends AddressAttributes {
  @ApiProperty({
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: Types.ObjectId & string;
}

export class CreateOrderDto extends OrderAttributes {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsObject()
  user: UserAttributes;

  @ApiProperty()
  @IsObject()
  userAddress: AddressAttributes;

  @ApiProperty()
  @IsObject()
  businessPartner: BusinessPartnerAttributes;

  @ApiProperty()
  @IsObject()
  warehouse: WarehouseAttributes;

  @ApiProperty()
  @IsObject()
  orderType: OrderTypeAttributes;

  @ApiProperty({
    type: [CreateOrderDetaillDto],
  })
  @ValidateNested()
  @IsObject({ each: true })
  @IsArray()
  @IsNotEmpty()
  orderDetaills: CreateOrderDetaillDto[];

  @ApiProperty()
  @IsBoolean()
  isProgrammed: boolean;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  programmedDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  deliveryDate: Date;

  @ApiProperty()
  @IsString()
  originType: string;

  @ApiProperty()
  @IsNumber()
  total: number;

  @ApiProperty()
  @IsNumber()
  tax: number;

  @ApiProperty()
  @IsNumber()
  discount: number;

  @ApiProperty()
  @IsNumber()
  deliveryPrice: number;

  @ApiProperty()
  @IsNumber()
  deliveryTax: number;

  @ApiProperty()
  @IsNumber()
  newTotal: number;

  @ApiProperty()
  @IsObject()
  courier: OrderCourierAttributes;
}
