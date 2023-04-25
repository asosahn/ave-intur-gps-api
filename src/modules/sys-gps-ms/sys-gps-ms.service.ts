import { Injectable } from '@nestjs/common';
import { SysGpsService } from '../sys-gps/sys-gps.service';
import { CreateSysGpDto } from '../sys-gps/dto/create-sys-gp.dto';
import { get, isArray } from 'lodash';
import { GpsAttributes } from '../../database/models/sys_gps/gps.attributes';
import * as moment from 'moment-timezone';

@Injectable()
export class SysGpsMsService {
  constructor(private readonly sysGpsService: SysGpsService) {}
  async create(createSysGpsMDto: CreateSysGpDto | CreateSysGpDto[]) {
    const data: GpsAttributes | GpsAttributes[] = isArray(createSysGpsMDto) ? createSysGpsMDto : [createSysGpsMDto];
    const addingGeoPoint: GpsAttributes[] = data.map((item: GpsAttributes) => {
      return {
        ...item,
        location: {
          ...item.location,
          timestampToDate: moment(item.location.timestamp).tz('America/Tegucigalpa').toDate(),
          timestampDate: moment(item.location.timestamp).tz('America/Tegucigalpa').format('YYYY-MM-DD'),
        },
        geoPoint: {
          type: 'Point',
          coordinates: [get(item, 'location.coords.longitude'), get(item, 'location.coords.latitude')],
        },
      };
    });
    return this.sysGpsService.createMany(addingGeoPoint);
  }
}
