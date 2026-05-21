import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenAuthGuard } from './guards/token-auth.guard';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenAuthGuard],
  exports: [AuthService, TokenAuthGuard],
})
export class AuthModule {}
