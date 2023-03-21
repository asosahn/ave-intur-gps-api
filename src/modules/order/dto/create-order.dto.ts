import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId, IsBoolean, IsOptional, IsObject, IsArray, IsDate, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import Address from '@albatrosdeveloper/ave-models-npm/lib/schemas/address/address.schema';
import AddressAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/address/address.entity';
import { Types } from 'mongoose';

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

export class CreateOrderDto {
  @ApiProperty({
    required: true,
  })
  @Type(() => UserDto)
  @IsNotEmpty()
  user: UserDto;

  @ApiProperty({
    required: true,
  })
  @Type(() => UserAddress)
  @IsNotEmpty()
  userAddress: UserAddress;

  @ApiProperty({
    required: true,
  })
  @IsObject()
  @IsNotEmpty()
  businessPartner: Record<string, any>;

  @ApiProperty({
    required: true,
  })
  @IsObject()
  @IsNotEmpty()
  warehouse: Record<string, any>;

  @ApiProperty({
    required: true,
  })
  @IsObject()
  @IsNotEmpty()
  orderType: Record<string, any>;

  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  orderDetails: Record<string, any>[];

  @ApiProperty({
    required: true,
  })
  @IsDate()
  @IsNotEmpty()
  deliveryDate: Date;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  originType: string;

  @ApiProperty({
    required: true,
  })
  @IsDecimal()
  @IsNotEmpty()
  total: number;

  @ApiProperty({
    required: true,
  })
  @IsDecimal()
  @IsNotEmpty()
  tax: number;

  @ApiProperty({
    required: true,
  })
  @IsDecimal()
  @IsNotEmpty()
  discount: number;

  @ApiProperty({
    required: true,
  })
  @IsDecimal()
  @IsNotEmpty()
  deliveryPrice: number;

  @ApiProperty({
    required: true,
  })
  @IsDecimal()
  @IsNotEmpty()
  newTotal: number;
}
