# 用户管理模块 (User)

## 概述

用户 CRUD、密码修改、Excel 导出。

## 数据模型

- **User**：用户表，密码使用 bcrypt 加密存储
- 支持软删除（deleteTime、deleteUser 字段）

## 接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/user/list` | 分页列表 | user:list |
| POST | `/api/user/create` | 新增用户 | user:add |
| PUT | `/api/user/update` | 更新用户 | user:edit |
| DELETE | `/api/user/delete` | 软删除 | user:delete |
| POST | `/api/user/change-password` | 修改密码 | 登录用户 |
| POST | `/api/user/export` | 导出 Excel | user:export |

## 特殊业务逻辑

### 密码处理
- 注册时使用 `bcrypt.hash(password, 10)` 加密
- 登录验证使用 `bcrypt.compare(plainPassword, hashedPassword)`
- 列表和导出接口返回时**过滤掉 passWord 字段**

### 用户名唯一性
- 创建和更新时检查 `userName` 是否已存在
- 更新时如果用户名没有变化，跳过冲突检查

### 创建人/修改人
- 通过 `formatList()` 工具函数自动填充 `createUserName`、`lastModifierName`
- `buildUserMap()` 批量查询用户 ID → 用户名映射（带缓存）

### 用户名缓存
- `UserService` 维护 `userNameCache: Map<number, string>`
- 用户信息变更时调用 `clearUserNameCache()` 清空缓存

## 前端相关

- `src/api/user.ts` — API 定义
- `src/views/user/UserManagement.vue` — 列表页
- `src/views/user/UserFormDialog.vue` — 新增/编辑弹窗
- 密码修改弹窗在 `AdminLayout.vue` 中（顶部导航栏下拉菜单）

### 搜索条件
- 用户名（模糊匹配）
- 状态（正常/停用）
- 创建时间范围

### 分页
- 使用 `httpWithBody` 实例获取完整响应（含 page/total），而非仅 data
