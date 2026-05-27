# 角色管理模块 (Role)

## 概述

角色 CRUD、权限分配（角色-菜单关联）、Excel 导出。

## 数据模型

- **Role**：角色表
- **UserRole**：用户-角色关联表（多对多）
- **RoleMenu**：角色-菜单关联表（多对多，含权限标识）

## 接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/role/list` | 分页列表 | role:list |
| POST | `/api/role/create` | 新增角色 | role:add |
| PUT | `/api/role/update` | 更新角色 | role:edit |
| DELETE | `/api/role/delete` | 软删除 | role:delete |
| GET | `/api/role/user-roles` | 获取用户已分配的角色 ID | role:list |
| POST | `/api/role/user-roles` | 分配用户角色 | role:edit |
| GET | `/api/role/role-menus` | 获取角色已分配的菜单 ID | role:list |
| POST | `/api/role/role-menus` | 分配角色菜单 | role:edit |
| POST | `/api/role/export` | 导出 Excel | role:export |

## 特殊业务逻辑

### 角色编码唯一性
- `roleCode` 唯一，创建和更新时检查冲突

### 菜单权限分配 — 祖先节点自动补全
保存时（`assignRoleMenus`），前端只传用户勾选的末端节点 ID，后端自动向上追溯 `parentId` 补全所有祖先节点，保证权限链完整。

### 角色-用户分配
- 先删除该用户的所有角色关联，再批量插入新关联
- 用于用户编辑弹窗中的角色选择

## 前端相关

- `src/api/role.ts` — API 定义
- `src/views/role/RoleManagement.vue` — 列表页
- `src/views/role/RoleFormDialog.vue` — 新增/编辑弹窗（含权限树配置）

### 权限树交互（RoleFormDialog.vue）

**重要：使用 `check-strictly` 模式（父子不联动）**

用户勾选菜单时，不会自动勾选子菜单或父菜单。这样可以精确控制权限粒度。

| 功能 | 说明 |
|------|------|
| 搜索过滤 | 输入关键词过滤菜单树，不影响已勾选状态 |
| 展开/折叠 | 切换所有树节点的展开/折叠状态 |
| 全选/取消 | 全选当前可见的所有节点 |
| 清空 | 清除所有勾选 |
| 右侧已选列表 | 展示所有已勾选的节点，可点击移除 |

### 提交逻辑
提交时调用 `getStrictCheckedIds()` 只返回用户手动勾选的节点 ID（不含半选父节点），后端自动补全祖先节点。
