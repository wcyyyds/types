import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';
import { MenuModule } from '../menu/menu.module';
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TokenAuthGuard } from "./guards/token-auth.guard";

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => MenuModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenAuthGuard],
  exports: [AuthService, TokenAuthGuard],
})
export class AuthModule {}
