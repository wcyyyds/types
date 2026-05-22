import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
