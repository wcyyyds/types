# web-2026-wcy 项目 AI 助手指南

## 项目概览

这是一个全栈管理后台项目，包含三个部分：

| 目录 | 技术栈 | 说明 |
|------|--------|------|
| `Admin-Server/` | NestJS 11 + TypeORM + MySQL + Redis + JWT | 后端 API 服务 |
| `vue-web/` | Vue 3 + Pinia + Vue Router + Element Plus + Tailwind CSS | 前端管理界面 |
| `shared/` | TypeScript 类型定义 | 前后端共享类型（单一事实来源） |

---

## 快速命令

### 后端 (Admin-Server)

```bash
# 开发启动（带 watch）
cd Admin-Server && pnpm run start:dev

# 构建
cd Admin-Server && pnpm run build

# 测试
cd Admin-Server && pnpm run test

# 初始化数据库（首次使用）
cd Admin-Server && pnpm run init-db

# 生成测试用户
cd Admin-Server && pnpm run generate-users
```

### 前端 (vue-web)

```bash
# 开发启动
cd vue-web && pnpm run dev

# 构建
cd vue-web && pnpm run build

# 单元测试
cd vue-web && pnpm run test:unit

# E2E 测试
cd vue-web && pnpm run test:e2e

# 类型检查
cd vue-web && pnpm run type-check

# 代码检查
cd vue-web && pnpm run lint
```

> **注意**：必须使用 `pnpm` 安装依赖，不要使用 npm 或 yarn。

---

## 后端架构要点

### 技术选型
- **认证方式**：自研 Token 认证（非 JWT），使用 UUID v4 生成随机 token，存储在 Redis
- **权限模型**：RBAC（基于角色的访问控制），权限标识通过 `@RequirePermissions()` 装饰器声明
- **API 前缀**：所有接口以 `/api` 开头（`main.ts` 中通过 `setGlobalPrefix('api')` 设置）
- **响应格式**：统一使用 `ApiResponseDto`，成功 `code: 0`，错误返回 HTTP 状态码
- **全局管道**：`ValidationPipe` 已启用 `whitelist` + `forbidNonWhitelisted` + `transform`

### 模块结构

```
src/modules/
├── auth/        # 认证模块 — 登录/登出/Token验证
├── user/        # 用户管理 — CRUD + 密码修改 + 导出
├── role/        # 角色管理 — CRUD + 权限关联 + 导出
├── menu/        # 菜单管理 — CRUD + 树形结构
└── redis/       # Redis 服务封装 — ioredis 连接管理
```

### 认证流程
1. `POST /api/auth/login` → 验证密码 → 生成 UUID token → 存入 Redis（Hash）
2. `TokenAuthGuard` → 从请求头提取 `Bearer token` → 通过 `HGETALL token:{accessToken}` 验证（O(1)）
3. 登录响应包含 `accessToken`、`roles`（角色编码列表）、`perms`（权限标识列表）、`menus`（菜单树）
4. Redis key 模式：`token:{accessToken}`（Hash，O(1) 直查），`user_tokens:{userId}`（Set，用户 token 索引），`perms:{userId}`（缓存的权限列表）
5. 同一账号仅保留一个有效 token，新登录会清除旧 token

### 数据模型
- **User**：用户表，密码使用 bcrypt 加密存储
- **Role**：角色表，通过 `UserRole` 中间表与用户多对多关联
- **Menu**：菜单表，支持三级类型（1:目录 2:菜单 3:按钮），通过 `RoleMenu` 中间表与角色多对多关联
- **RoleMenu**：角色-菜单关联表，含权限标识字段
- 所有实体支持软删除（`deleteTime`、`deleteUser`、`deleteUserName` 字段）

### 常见约定
- 所有业务 controller 使用 `@UseGuards(TokenAuthGuard)`
- 分页接口统一使用 `@Query()` 接收 `page`、`pageSize` 参数
- 列表查询参数通过 `@shared/types` 中的类型定义约束
- 导出功能使用 `ExcelJS` 生成 Excel 文件
- `formatList()` 工具函数自动填充 `createUserName`、`lastModifierName` 等关联字段

---

## 前端架构要点

### 技术选型
- **状态管理**：Pinia（`user` 和 `theme` 两个 store）
- **UI 框架**：Element Plus（自动导入，已配置 `unplugin-auto-import` 和 `unplugin-vue-components`）
- **HTTP 客户端**：Axios（`src/api/index.ts` 中配置拦截器）
- **路由守卫**：基于 token 存在性判断登录状态
- **主题系统**：支持 light/dark 切换，通过 CSS 变量 + HTML `dark` class 实现

### 路径别名
- `@/` → `src/`
- `@shared/` → `../shared/`（共享类型目录）

### 关键组件
- `AdminLayout.vue`：后台主布局（侧边栏 + 顶栏 + 内容区），菜单从 `userStore.userInfo?.menus` 动态渲染
- `AuthLayout.vue`：登录页布局
- `AppPagination.vue`：分页封装组件
- `ThemeToggle.vue`：主题切换组件
- `v-permission` 指令：根据用户权限标识控制 DOM 元素显隐

### API 响应处理
- 成功码 `code === 0` 时返回 `response.data.data`
- 非零 `code` 时弹出错误提示并 reject
- 401 响应时弹出确认框，可选择强制登出

---

## 共享类型 (`shared/types/`)

`shared/types/` 是前后端共享的类型定义目录，在 `vue-web` 中通过 `@shared/` 别名引用，在 `Admin-Server` 中通过 `@shared/types` 路径引用。

- `index.ts` — 通用响应类型 `ApiResponse<T>`、`ApiResponsePage<T>`、`TableParams`
- `auth.ts` — `LoginParams`、`LogoutParams`、`ForceLogoutParams`
- `user.ts` — `UserInfo`、`CreateUserParams`、`UpdateUserParams`、`UserListParams`、`ChangePasswordParams`
- `role.ts` — `RoleInfo`、`CreateRoleParams`、`UpdateRoleParams`、`RoleListParams`
- `menu.ts` — `MenuInfo`（含 `MenuType: 1|2|3`）、`CreateMenuParams`、`UpdateMenuParams`

---

## 开发注意事项

1. **数据库同步**：`TypeORM` 的 `synchronize: true` 仅在非生产环境启用，生产环境需手动迁移
2. **Redis 依赖**：后端强依赖 Redis（Token 存储），Redis 不可用时认证功能会降级
3. **Token 格式**：`tok_` 前缀 + UUID（无连字符），如 `tok_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. **Token 验证**：Key 模式为 `token:{accessToken}`（Hash），直接 `HGETALL` 查询，O(1) 时间复杂度
5. **用户索引**：`user_tokens:{userId}`（Set）维护用户的所有 token，用于单点登录和强制登出，无需 `KEYS` 遍历
6. **密码加密**：使用 `bcrypt` 库，密码字段在数据库中存储为哈希值
7. **软删除**：所有实体使用 `deleteTime` 字段实现软删除，查询时需过滤 `deleteTime: IsNull()`
8. **前端类型安全**：修改共享类型后需同时更新前后端引用，保持单一事实来源
