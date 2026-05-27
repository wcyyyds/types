# 通用架构与最佳实践

## 项目结构

```
Admin-Server/          # NestJS 后端
├── src/
│   ├── common/        # 公共模块（DTO、过滤器、守卫、工具函数）
│   ├── modules/       # 业务模块（auth/user/role/menu/redis）
│   └── main.ts        # 入口

vue-web/               # Vue 3 前端
├── src/
│   ├── api/           # API 接口层
│   ├── components/    # 公共组件
│   ├── composables/   # 组合式函数
│   ├── directives/    # 自定义指令
│   ├── layouts/       # 布局组件
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia 状态管理
│   ├── styles/        # 全局样式
│   ├── types/         # 类型定义（重导出 shared）
│   ├── utils/         # 工具函数
│   └── views/         # 页面组件

shared/                # 前后端共享类型
└── types/             # TypeScript 类型定义
```

## 后端最佳实践

### 统一响应格式
所有接口返回 `ApiResponseDto`：
- 成功：`code: 0`，数据在 `data` 字段
- 错误：返回 HTTP 状态码，错误信息在 `message` 字段

### 全局管道
`ValidationPipe` 已启用 `whitelist` + `forbidNonWhitelisted` + `transform`，自动过滤和转换请求参数。

### 权限控制
- `@UseGuards(TokenAuthGuard, PermissionsGuard)` 保护需要登录的接口
- `@RequirePermissions('role:edit')` 声明需要的权限标识
- 权限标识通过 `RoleMenu` 关联表与角色关联

### 软删除
所有实体使用 `deleteTime`、`deleteUser`、`deleteUserName` 字段实现软删除，查询时需过滤 `deleteTime: IsNull()`。

### 代码复用模式
- `buildRoleListWhere()` / `buildUserListWhere()` — 提取列表和导出接口中重复的查询条件构建逻辑
- `formatListData()` / `formatUserList()` — 提取列表格式化逻辑
- 避免在 `findAllForExport` 和 `findXxxList` 中重复编写相同的 where 条件

## 前端最佳实践

### API 层
- `src/api/index.ts` 创建了两个 Axios 实例：
  - `http` — 默认实例，成功时仅返回 `data` 负载
  - `httpWithBody` — 返回完整 `ApiResponse`（含 page/total），用于分页列表
- 响应拦截器统一处理业务错误（code !== 0）和 401

### 状态管理
- `userStore` — 用户登录状态、用户信息、权限菜单
- `themeStore` — 主题切换（light/dark）

### 权限指令
`v-permission` 指令根据用户权限标识控制 DOM 元素显隐：
```vue
<button v-permission="'user:delete'">删除</button>
<button v-permission="['user:edit', 'user:add']">操作</button>
```

### 路由守卫
- 未登录 → 跳转 `/login`
- 已登录访问 `/login` → 跳转 `/dashboard`

### 样式体系
- `management-list.scss` — 列表页通用布局（搜索栏 + 表格卡片 + 分页）
- `theme.scss` — 主题 CSS 变量（light/dark）
- Tailwind CSS — 工具类

### 导出功能
使用 `downloadExport()` 工具函数，调用后端导出接口并下载 Excel 文件。

## 共享类型

`shared/types/` 是单一事实来源，前后端共享：
- `index.ts` — 通用响应类型 `ApiResponse<T>`、`ApiResponsePage<T>`
- `auth.ts` — 登录/登出参数
- `user.ts` — 用户相关类型
- `role.ts` — 角色相关类型
- `menu.ts` — 菜单相关类型（含 `MenuTypeConst` 常量）
