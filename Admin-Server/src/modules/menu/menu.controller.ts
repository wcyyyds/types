import {
  Controller, Get, Post, Put, Delete, Body, Query, UseGuards, Request, Res,
} from "@nestjs/common";
import type { Request as ExpressRequest, Response } from "express";
import * as ExcelJS from "exceljs";
import { MenuService } from "./menu.service";
import { ApiResponseDto } from "../../common/dto/api-response.dto";
import { TokenAuthGuard } from '../auth/guards/token-auth.guard';
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import type { CreateMenuParams, UpdateMenuParams, MenuInfo } from "@shared/types/menu";
import { MenuTypeConst, MenuTypeLabel } from "@shared/types/menu";

@Controller("menu")
@UseGuards(TokenAuthGuard, PermissionsGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 获取菜单树（树形结构）
   */
  @Get("tree")
  async getMenuTree(
    @Query('isActive') isActive?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ApiResponseDto<MenuInfo[]>> {
    const list = await this.menuService.getMenuTree(
      isActive !== undefined ? isActive === 'true' : undefined,
      keyword,
    );
    const tree = MenuService.buildTree(list);
    return ApiResponseDto.success(tree, "获取菜单树成功");
  }

  /**
   * 获取扁平菜单列表（供管理页面使用）
   */
  @Get("list")
  async getMenuList(
    @Query('isActive') isActive?: string,
    @Query('keyword') keyword?: string,
  ): Promise<ApiResponseDto<MenuInfo[]>> {
    const list = await this.menuService.getMenuTree(
      isActive !== undefined ? isActive === 'true' : undefined,
      keyword,
    );
    return ApiResponseDto.success(list, "获取菜单列表成功");
  }

  @Post("create")
  @RequirePermissions('menu:add')
  async createMenu(
    @Body() body: CreateMenuParams,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<any>> {
    const operatorId = req.user!.sub;
    const result = await this.menuService.createMenu({ ...body, operatorId });
    return ApiResponseDto.success(result, "新增菜单成功");
  }

  @Put("update")
  @RequirePermissions('menu:edit')
  async updateMenu(
    @Body() body: UpdateMenuParams,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<any>> {
    const operatorId = req.user!.sub;
    const result = await this.menuService.updateMenu({ ...body, operatorId });
    return ApiResponseDto.success(result, "更新菜单成功");
  }

  @Delete("delete")
  @RequirePermissions('menu:delete')
  async deleteMenu(
    @Query('id') id: number,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponseDto<null>> {
    const operatorId = req.user!.sub;
    await this.menuService.deleteMenu(Number(id), operatorId);
    return ApiResponseDto.success(null, "删除菜单成功");
  }

  @Post("export")
  @RequirePermissions('menu:export')
  async exportMenuList(
    @Res() res: Response,
  ) {
    const list = await this.menuService.getMenuTree();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Admin-Server';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('菜单列表');

    sheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '菜单名称', key: 'title', width: 20 },
      { header: '图标', key: 'icon', width: 12 },
      { header: '类型', key: 'type', width: 10 },
      { header: '权限标识', key: 'perms', width: 22 },
      { header: '路由路径', key: 'path', width: 22 },
      { header: '排序', key: 'sort', width: 8 },
      { header: '状态', key: 'status', width: 8 },
      { header: '创建人', key: 'createUserName', width: 16 },
      { header: '创建时间', key: 'createTime', width: 22 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { name: '微软雅黑', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 28;

    const typeMap: Record<number, string> = MenuTypeLabel;

    list.forEach((item, i) => {
      sheet.addRow({
        index: i + 1,
        title: item.title ?? '',
        icon: item.icon ?? '',
        type: typeMap[item.type] ?? '',
        perms: item.perms ?? '',
        path: item.path ?? '',
        sort: item.sort ?? 0,
        status: item.isActive ? '启用' : '禁用',
        createUserName: item.createUserName ?? '',
        createTime: item.createTime ?? '',
      });
    });

    const dataRows = sheet.getRows(2, list.length);
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

    list.forEach((_, i) => {
      if (i % 2 === 1) {
        const row = sheet.getRow(i + 2);
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FF' } };
        });
      }
    });

    const fileName = `菜单列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
