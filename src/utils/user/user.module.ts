import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import User, {
  UserSchema,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.schema';
import SuperUser, {
  SuperUserSchema,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/superUser/superUser.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
        collection: 'user',
      },
      {
        name: SuperUser.name,
        schema: SuperUserSchema,
        collection: 'superUser',
      },
    ]),
  ],
  providers: [UserService],
  exports: [UserModule, UserService],
})
export class UserModule {}
