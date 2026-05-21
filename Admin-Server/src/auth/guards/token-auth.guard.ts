import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('未提供访问令牌');
    }

    // 通过 Redis 查询 token 是否有效，并获取用户信息
    const user = await this.authService.validateToken(token);
    if (!user) {
      throw new UnauthorizedException('访问令牌已失效');
    }

    // 将用户信息附加到请求对象上
    request.user = user;
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
