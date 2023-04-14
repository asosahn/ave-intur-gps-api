import { ApiProperty } from '@nestjs/swagger';
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
}