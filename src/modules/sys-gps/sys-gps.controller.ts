import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SysGpsService } from './sys-gps.service';
import { CreateSysGpDto } from './dto/create-sys-gp.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('gps')
@Controller('gps')
export class SysGpsController {
  constructor(private readonly sysGpsService: SysGpsService) {}

  @Post('set')
  async create(@Body() createSysGpDto: CreateSysGpDto) {
    return this.sysGpsService.create(createSysGpDto);
  }

  @Post('get_all_by_multidriver')
  async findGroupByUserId(@Body('data') data: string[]) {
    return this.sysGpsService.findGroupByUserId(data);
  }

  @Get('drivers_by_day')
  getCountDriversByDate(@Query('date') date: string) {
    return this.sysGpsService.getCountDriversByDate(date);
  }
  @Get('last_records_by_user_id')
  getLastRecordByUserId(@Query('userId') userId: string, @Query('limit') limit: number) {
    return this.sysGpsService.getLastRecordByUserId(userId, limit);
  }
}
