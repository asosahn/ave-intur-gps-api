import { PartialType } from '@nestjs/mapped-types';
import { CreateSysGpsMDto } from './create-sys-gps-m.dto';

export class UpdateSysGpsMDto extends PartialType(CreateSysGpsMDto) {
  id: number;
}
