import {
  Controller, Get, Post, Put, Delete, Body, Query, UseGuards, Request, Res,
  UseInterceptors, UploadedFile, BadRequestException, NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import type { Response, Request as ExpressRequest } from "express";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { UserService } from "./user.service";
import { ApiResponseDto } from "../../common/dto/api-response.dto";
import type {
  UserInfo,
  UserListParams,
  CreateUserParams,
  UpdateUserParams,
  ChangePasswordParams,
} from "@shared/types/user";
import { ApiResponsePage } from "@shared/types";
import { TokenAuthGuard } from "../auth/guards/token-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("user")
@UseGuards(TokenAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ============================================================
  // 头像上传
  // ============================================================

  /**
   * 上传头像
   */
  @Post('upload-avatar')
  @UseGuards(TokenAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'avatars');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('仅支持 jpg/png/gif/webp 格式'), false);
        }
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<string>> {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const userId = (req as any).user?.sub;

    if (userId) {
      await this.userService.updateUser({
        id: userId,
        avatar: avatarUrl,
        operatorId: userId,
      } as any);
    }

    return ApiResponseDto.success(avatarUrl, '头像上传成功');
  }

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
    @Query('createTimeStart') createTimeStart?: string,
    @Query('createTimeEnd') createTimeEnd?: string,
  ): Promise<ApiResponsePage<UserInfo[]>> {
    const result = await this.userService.findUserList({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      userName,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      createTimeStart,
      createTimeEnd,
    });
    return ApiResponseDto.successWithPage(
      result.data,
      result.page ?? 1,
      result.pageSize ?? 20,
      result.total ?? 0,
      "获取用户列表成功",
    );
  }

  /**
   * 获取当前登录用户信息
   */
  @Get("profile")
  async getProfile(
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<any>> {
    const userId = req.user!.sub;
    const user = await this.userService.findByUserId(userId);
    if (!user) {
      throw new NotFoundException("用户不存在");
    }
    const { passWord: _, ...result } = user;
    return ApiResponseDto.success(result, "获取用户信息成功");
  }

  /**
   * 新增用户
   */
  @Post("create")
  @RequirePermissions('user:add')
  async createUser(
    @Body() body: CreateUserParams,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<any>> {
    const operatorId = req.user!.sub;
    const result = await this.userService.createUser({ ...body, operatorId });
    return ApiResponseDto.success(result, "新增用户成功");
  }

  /**
   * 更新用户
   */
  @Put("update")
  @RequirePermissions('user:edit')
  async updateUser(
    @Body() body: UpdateUserParams,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<any>> {
    const operatorId = req.user!.sub;
    const result = await this.userService.updateUser({ ...body, operatorId });
    return ApiResponseDto.success(result, "更新用户成功");
  }

  /**
   * 删除用户（软删除）
   */
  @Delete("delete")
  @RequirePermissions('user:delete')
  async deleteUser(
    @Query('id') id: number,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<null>> {
    const operatorId = req.user!.sub;
    await this.userService.deleteUser(Number(id), operatorId);
    return ApiResponseDto.success(null, "删除用户成功");
  }

  /**
   * 修改当前用户密码
   */
  @Post("change-password")
  async changePassword(
    @Body() body: ChangePasswordParams,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<null>> {
    const userId = req.user!.sub;
    await this.userService.changePassword({ userId, oldPassword: body.oldPassword, newPassword: body.newPassword });
    return ApiResponseDto.success(null, "密码修改成功");
  }

  /**
   * 导出用户列表（Excel .xlsx）
   * 查询参数与列表接口 getUserList 完全一致
   */
  @Post("export")
  @RequirePermissions('user:export')
  async exportUserList(
    @Res() res: Response,
    @Body() body: UserListParams,
  ) {
    const data = await this.userService.findAllForExport(body);

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Admin-Server';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('用户列表');

    // 定义列
    sheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '用户名', key: 'userName', width: 18 },
      { header: '邮箱', key: 'email', width: 30 },
      { header: '手机号', key: 'phone', width: 18 },
      { header: '状态', key: 'status', width: 10 },
      { header: '创建人', key: 'createUserName', width: 16 },
      { header: '创建时间', key: 'createTime', width: 22 },
      { header: '最后修改人', key: 'lastModifierName', width: 16 },
      { header: '最后修改时间', key: 'lastModified', width: 22 },
    ];

    // 表头样式
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: '微软雅黑', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 28;

    // 填充数据
    data.forEach((u, i) => {
      sheet.addRow({
        index: i + 1,
        userName: u.userName ?? '',
        email: u.email ?? '',
        phone: u.phone ?? '',
        status: u.isActive ? '启用' : '禁用',
        createUserName: u.createUserName ?? '',
        createTime: u.createTime ?? '',
        lastModifierName: u.lastModifierName ?? '',
        lastModified: u.lastModified ?? '',
      });
    });

    // 数据行样式
    const dataRows = sheet.getRows(2, data.length);
    if (dataRows) {
      dataRows.forEach((row) => {
        row.alignment = { horizontal: 'center', vertical: 'middle' };
        row.height = 24;
        row.eachCell((cell) => {
          cell.font = { name: '微软雅黑', size: 10 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        });
      });
    }

    // 斑马纹
    data.forEach((_, i) => {
      const rowNum = i + 2;
      if (i % 2 === 1) {
        const row = sheet.getRow(rowNum);
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } };
        });
      }
    });

    // 写出
    const fileName = `用户列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
