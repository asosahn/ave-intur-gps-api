import { PartialType } from '@nestjs/swagger';
import { CreateStoreLogDto } from './create-store-log.dto';

export class UpdateStoreLogDto extends PartialType(CreateStoreLogDto) {}
