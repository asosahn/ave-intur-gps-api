import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import User, {
  UserDocument,
  UserModelExt,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.schema';
import {
  andAllWhere,
  buildQuery,
  CombinedFilter,
  Normalizers,
  Ops,
  where,
} from '@albatrosdeveloper/ave-utils-npm/lib/utils/query.util';
import UserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.entity';
import SuperUserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/superUser/superUser.entity';
import SuperUser, {
  SuperUserDocument,
  SuperUserModelExt,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/superUser/superUser.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: UserModelExt<UserDocument>,
    @InjectModel(SuperUser.name)
    private readonly superUserModel: SuperUserModelExt<SuperUserDocument>,
  ) {}

  async getUserById(id: string) {
    const query = buildQuery<UserAttributes>(
      where('_id', Ops.eq(id, Normalizers.ObjectId)),
      where('active', '1'),
      andAllWhere('_deleted', false),
    ) as CombinedFilter<UserAttributes>;
    return this.userModel.getDocument(query);
  }
  async getSuperUserById(id: string) {
    const query = buildQuery<SuperUserAttributes>(
      where('_id', Ops.eq(id, Normalizers.ObjectId)),
      where('enabled', true),
      andAllWhere('_deleted', false),
    ) as CombinedFilter<SuperUserAttributes>;
    return this.superUserModel.getDocument(query);
  }
}
