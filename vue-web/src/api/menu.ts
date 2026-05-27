import http from "./index";
import type { MenuInfo, CreateMenuParams, UpdateMenuParams } from "@/types";

/**
 * 获取菜单树（树形结构）
 */
export function getMenuTreeApi(isActive?: boolean, keyword?: string): Promise<MenuInfo[]> {
  return http.get("/menu/tree", { params: { isActive, keyword } });
}

/**
 * 获取扁平菜单列表
 */
export function getMenuListApi(isActive?: boolean): Promise<MenuInfo[]> {
  return http.get("/menu/list", { params: { isActive } });
}

/**
 * 新增菜单
 */
export function createMenuApi(params: CreateMenuParams): Promise<MenuInfo> {
  return http.post("/menu/create", params);
}

/**
 * 更新菜单
 */
export function updateMenuApi(params: UpdateMenuParams): Promise<MenuInfo> {
  return http.put("/menu/update", params);
}

/**
 * 删除菜单
 */
export function deleteMenuApi(id: number): Promise<void> {
  return http.delete("/menu/delete", { params: { id } });
}
