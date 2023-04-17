import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateStatusCourierDto {

    @ApiProperty({
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    orderCode: string;

    @ApiProperty({
      required: true,
    })
    @IsNumber()
    @IsNotEmpty()
    status: number; // subStatus del pedido

    @ApiProperty({
      required: true,
    })
    @IsNotEmpty()
    @Type(() => Date)
    date: Date;
}