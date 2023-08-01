import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateSysGpDto } from './dto/create-sys-gp.dto';
import { UpdateSysGpDto } from './dto/update-sys-gp.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { first, isArray, isEmpty } from 'lodash';
import { ClientProxy } from '@nestjs/microservices';
import SysGps, { GpsDocument } from '../../database/models/sys_gps/gps.schema';
import { GpsAttributes } from '../../database/models/sys_gps/gps.attributes';

@Injectable()
export class SysGpsService {
  constructor(
    @InjectModel(SysGps.name) private sysGpModel: Model<GpsDocument>,
    @Inject('SYS_GPS_SERVICE') private readonly sysGpsService: ClientProxy,
  ) {}

  async sendToSysGpsQueue({ queue, data }) {
    return this.sysGpsService.emit(queue, data).toPromise();
  }
  async create(createSysGpDto: CreateSysGpDto) {
    try {
      await this.sendToSysGpsQueue({ queue: 'gps-queue', data: createSysGpDto });
      return createSysGpDto;
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async createMany(data: CreateSysGpDto[] | CreateSysGpDto) {
    try {
      return this.sysGpModel.insertMany(isArray(data) ? data : [data], { ordered: false });
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async findGroupByUserId(userIds: string[]) {
    try {
      const result: GpsAttributes[] = await this.sysGpModel
        .aggregate([
          {
            $match: {
              userId: { $in: isArray(userIds) ? userIds : [userIds] },
            },
          },
          {
            $sort: {
              'location.timestampToDate': -1,
            },
          },
          {
            $group: {
              _id: '$userId',
              firstDocument: { $first: '$$ROOT' },
            },
          },
          {
            $replaceRoot: {
              newRoot: '$firstDocument',
            },
          },
          {
            $project: {
              event: '$location.event',
              is_moving: '$location.is_moving',
              uuid: '$location.uuid',
              timestamp: '$location.timestamp',
              odometer: '$location.odometer',
              latitude: '$location.coords.latitude',
              longitude: '$location.coords.longitude',
              accuracy: '$location.coords.accuracy',
              speed: '$location.coords.speed',
              heading: '$location.coords.heading',
              speed_accuracy: '$location.coords.speed_accuracy',
              heading_accuracy: '$location.coords.heading_accuracy',
              altitude: '$location.coords.altitude',
              altitude_accuracy: '$location.coords.altitude_accuracy',
              activity: '$location.activity',
              battery: '$location.battery',
              extras: '$location.extras',
              userId: 1,
              sessionId: 1,
              orderCode: 1,
              userNumber: 1,
              userName: 1,
              id: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ])
        .allowDiskUse(true)
        .read('secondaryPreferred')
        .exec();
      return result;
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  // async findGroupByUserId(userIds: string[]) {
  //   try {
  //     const result: GpsAttributes[] = await this.sysGpModel
  //       .aggregate([
  //         {
  //           $match: {
  //             userId: { $in: isArray(userIds) ? userIds : [userIds] },
  //           },
  //         },
  //         {
  //           $group: {
  //             _id: { userId: '$userId', timestamp: '$location.timestamp', latitude: '$location.latitude', longitude: '$location.longitude' },
  //           },
  //         },
  //         {
  //           $replaceRoot: {
  //             newRoot: {
  //               $mergeObjects: [{ userId: '$_id.userId', timestamp: '$_id.timestamp', latitude: '$_id.latitude', longitude: '$_id.longitude' }],
  //             },
  //           },
  //         },
  //         {
  //           $sort: {
  //             userId: 1,
  //             timestamp: -1,
  //           },
  //         },
  //       ])
  //       .allowDiskUse(true)
  //       .read('secondaryPreferred')
  //       .exec();
  //     return result;
  //   } catch (err) {
  //     throw new HttpException(
  //       {
  //         status: HttpStatus.FORBIDDEN,
  //         error: !isEmpty(err) ? err : err.message,
  //       },
  //       HttpStatus.FORBIDDEN,
  //     );
  //   }
  // }

  async getCountDriversByDate(date: string) {
    try {
      const amount = await this.sysGpModel
        .aggregate([
          {
            $match: {
              'location.timestampDate': date,
            },
          },
          {
            $group: {
              _id: { userId: '$userId', timestamp: '$location.timestampDate' },
            },
          },
          {
            $group: {
              _id: '$_id.timestamp',
              total: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              total: 1,
            },
          },
        ])
        .allowDiskUse(true)
        .read('secondaryPreferred')
        .exec();
      return first(amount);
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async getLastRecordByUserId(userId: string, limit = 10) {
    try {
      return this.sysGpModel.find({ userId }).sort({ 'location.timestampToDate': -1 }).limit(limit).read('secondaryPreferred').lean().exec();
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
