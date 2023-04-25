import { PartialType } from '@nestjs/swagger';
import { CreateSysGpDto } from './create-sys-gp.dto';

export class UpdateSysGpDto extends PartialType(CreateSysGpDto) {}
