import {
  Controller, Get, Post, Put, Delete, Body, Query, UseGuards, Request, Res,
} from "@nestjs/common";
import { Response } from "express";
import * as ExcelJS from "exceljs";
import { RoleService } from "./role.service";
import { ApiResponseDto } from "../common/dto/api-response.dto";
import { TokenAuthGuard } from "../auth/guards/token-auth.guard";
import type {
  CreateRoleParams,
  UpdateRoleParams,
  RoleInfo,
  RoleListParams,
} from "@shared/types/role";
import { ApiResponsePage } from "@shared/types";

@Controller("role")
@UseGuards(TokenAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * 分页查询角色列表
   */
  @Get("list")
  async getRoleList(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('roleName') roleName?: string,
    @Query('roleCode') roleCode?: string,
    @Query('isActive') isActive?: string,
    @Query('createTimeStart') createTimeStart?: string,
    @Query('createTimeEnd') createTimeEnd?: string,
  ): Promise<ApiResponsePage<RoleInfo[]>> {
    const result = await this.roleService.findRoleList({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      roleName,
      roleCode,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      createTimeStart,
      createTimeEnd,
    });
    return ApiResponseDto.successWithPage(
      result.data,
      result.page,
      result.pageSize,
      result.total,
      "获取角色列表成功",
    );
  }

  /**
   * 新增角色
   */
  @Post("create")
  async createRole(
    @Body() body: CreateRoleParams,
    @Request() req,
  ): Promise<ApiResponseDto<any>> {
    const operatorId = req.user?.sub;
    const result = await this.roleService.createRole({ ...body, operatorId });
    return ApiResponseDto.success(result, "新增角色成功");
  }

  /**
   * 更新角色
   */
  @Put("update")
  async updateRole(
    @Body() body: UpdateRoleParams,
    @Request() req,
  ): Promise<ApiResponseDto<any>> {
    const operatorId = req.user?.sub;
    const result = await this.roleService.updateRole({ ...body, operatorId });
    return ApiResponseDto.success(result, "更新角色成功");
  }

  /**
   * 删除角色（软删除）
   */
  @Delete("delete")
  async deleteRole(
    @Query('id') id: number,
    @Request() req,
  ): Promise<ApiResponseDto<null>> {
    const operatorId = req.user?.sub;
    await this.roleService.deleteRole(Number(id), operatorId);
    return ApiResponseDto.success(null, "删除角色成功");
  }

  /**
   * 导出角色列表（Excel .xlsx）
   */
  @Post("export")
  async exportRoleList(
    @Res() res: Response,
    @Body() body: RoleListParams,
  ) {
    const data = await this.roleService.findAllForExport(body);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Admin-Server';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('角色列表');

    sheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '角色名称', key: 'roleName', width: 18 },
      { header: '角色编码', key: 'roleCode', width: 20 },
      { header: '排序', key: 'sort', width: 8 },
      { header: '状态', key: 'status', width: 10 },
      { header: '备注', key: 'remark', width: 30 },
      { header: '创建人', key: 'createUserName', width: 16 },
      { header: '创建时间', key: 'createTime', width: 22 },
      { header: '最后修改人', key: 'lastModifierName', width: 16 },
      { header: '最后修改时间', key: 'lastModified', width: 22 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { name: '微软雅黑', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 28;

    data.forEach((u, i) => {
      sheet.addRow({
        index: i + 1,
        roleName: u.roleName ?? '',
        roleCode: u.roleCode ?? '',
        sort: u.sort ?? 0,
        status: u.isActive ? '正常' : '停用',
        remark: u.remark ?? '',
        createUserName: u.createUserName ?? '',
        createTime: u.createTime ?? '',
        lastModifierName: u.lastModifierName ?? '',
        lastModified: u.lastModified ?? '',
      });
    });

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

    data.forEach((_, i) => {
      const rowNum = i + 2;
      if (i % 2 === 1) {
        const row = sheet.getRow(rowNum);
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } };
        });
      }
    });

    const fileName = `角色列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
