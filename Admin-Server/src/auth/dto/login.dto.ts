import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import type { LoginParams } from '@shared/types/auth';

export class LoginDto implements LoginParams {
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于3个字符' })
  @MaxLength(20, { message: '用户名长度不能超过20个字符' })
  @IsOptional()
  userName: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  @MaxLength(20, { message: '密码长度不能超过20个字符' })
  @IsOptional()
  passWord: string;
}
