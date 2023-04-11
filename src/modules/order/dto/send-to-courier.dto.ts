import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SendOrderToCourierDto {

    @ApiProperty({
        required: false,
        type: [String],
    })
    @IsString({ each: true })
    @IsArray()
    @IsNotEmpty()
    orderIds: string[];
}
