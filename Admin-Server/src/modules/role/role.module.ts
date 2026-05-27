import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { UserRole } from "./entities/user-role.entity";
import { RoleMenu } from "./entities/role-menu.entity";
import { Menu } from "../menu/entities/menu.entity";
import { RoleService } from "./role.service";
import { RoleController } from "./role.controller";
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, UserRole, RoleMenu, Menu]),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
