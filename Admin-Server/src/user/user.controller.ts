import {
  Controller, Get, Post, Put, Delete, Body, Query, UseGuards, Request,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { TokenAuthGuard } from "../auth/guards/token-auth.guard";
import {
  CreateUserParams,
  UpdateUserParams,
  ChangePasswordParams,
  UserInfo,
} from "@shared/types/user";
import { ApiResponsePage } from "@shared/types";

@Controller("user")
@UseGuards(TokenAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ============================================================
  // 人员管理
  // ============================================================

  /**
   * 分页查询用户列表
   */
  @Get("list")
  async getUserList(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('userName') userName?: string,
    @Query('isActive') isActive?: string,
  ): Promise<ApiResponsePage<UserInfo[]>> {
    const result = await this.userService.findUserList({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      userName,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    return ApiResponseDto.successWithPage(
      result.data,
      result.page,
      result.pageSize,
      result.total,
      "获取用户列表成功",
    );
  }

  /**
   * 新增用户
   */
  @Post("create")
  async createUser(
    @Body() body: CreateUserParams,
    @Request() req,
  ): Promise<ApiResponseDto<any>> {
    const operatorId = req.user?.sub;
    const result = await this.userService.createUser({ ...body, operatorId });
    return ApiResponseDto.success(result, "新增用户成功");
  }

  /**
   * 更新用户
   */
  @Put("update")
  async updateUser(
    @Body() body: UpdateUserParams,
    @Request() req,
  ): Promise<ApiResponseDto<any>> {
    const operatorId = req.user?.sub;
    const result = await this.userService.updateUser({ ...body, operatorId });
    return ApiResponseDto.success(result, "更新用户成功");
  }

  /**
   * 删除用户（软删除）
   */
  @Delete("delete")
  async deleteUser(
    @Query('id') id: number,
    @Request() req,
  ): Promise<ApiResponseDto<null>> {
    const operatorId = req.user?.sub;
    await this.userService.deleteUser(Number(id), operatorId);
    return ApiResponseDto.success(null, "删除用户成功");
  }

  /**
   * 修改当前用户密码
   */
  @Post("change-password")
  async changePassword(
    @Body() body: ChangePasswordParams,
    @Request() req,
  ): Promise<ApiResponseDto<null>> {
    const userId = req.user?.sub;
    await this.userService.changePassword({ userId, ...body });
    return ApiResponseDto.success(null, "密码修改成功");
  }
}
