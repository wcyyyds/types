import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ApiResponseDto } from "../../common/dto/api-response.dto";
import { TokenAuthGuard } from "./guards/token-auth.guard";
import type { ForceLogoutParams } from "@shared/types/auth";
import { UserInfo } from "@shared/types/user";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto<UserInfo>> {
    const result = await this.authService.login(loginDto);
    return ApiResponseDto.success(result, '登录成功');
  }

  /**
   * 正常登出（需携带 token，仅清除当前 token）
   */
  @Post('logout')
  @UseGuards(TokenAuthGuard)
  async logout(@Request() req: ExpressRequest): Promise<ApiResponseDto<null>> {
    const userId = req.user!.sub;
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout({ userId, token });
    return ApiResponseDto.success(null, '登出成功');
  }

  /**
   * 强制登出（无需 token，只需 userId）
   * 适用于：本地 token 丢失、账号被踢、清理残留数据
   */
  @Post('logout/force')
  async forceLogout(@Body() body: ForceLogoutParams): Promise<ApiResponseDto<null>> {
    if (!body.userId) {
      return ApiResponseDto.error(400, '用户ID不能为空');
    }
    await this.authService.forceLogout(body);
    return ApiResponseDto.success(null, '强制登出成功');
  }
}