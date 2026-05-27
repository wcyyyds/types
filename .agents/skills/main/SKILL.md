---
name: web-2026-wcy-guide
description: 专门指导 web-2026-wcy 项目全栈开发的专属规则，规范 Vue3 前端和 NestJS 后端开发。
tags: [vue3, nestjs, typeorm, redis, shared-types]
---

# web-2026-wcy 项目 AI 开发助手专属技能

当你（GitHub Copilot）为该项目编写、重构代码或排查 Bug 时，必须严格加载并遵循以下规则：

## 1. 契约优先与强类型约束（Shared Types）
- 本项目是全栈 Monorepo 结构，前后端通过 `shared/types/` 共享类型定义。
- **禁止**在前端（vue-web）或后端（Admin-Server）单独硬编码接口字段。
- 修改或新增业务模型时，必须先阅读并扩展 `shared/types/`（前端别名 `@shared/`，后端别名 `@shared/types`）。

## 2. 后端核心规范 (NestJS 11 + TypeORM + Redis)
- **认证体系**：**严禁使用 JWT**。认证使用自研 Token，格式为 `tok_` + UUID v4，状态存储在 Redis Hash 中（Key 模式为 `token:{accessToken}`，O(1) 直查）。用户 token 索引通过 `user_tokens:{userId}`（Set）维护，用于单点登录和强制登出。
- **AOP 守卫**：业务 Controller 默认必须挂载 `@UseGuards(TokenAuthGuard)`。按钮/接口权限使用 `@RequirePermissions('标识')`。
- **输入校验**：使用 `class-validator` 配合全局 `ValidationPipe`（已开启 `whitelist` 与 `forbidNonWhitelisted`）。
- **软删除**：所有数据库查询必须拦截或自带 `deleteTime: IsNull()`，防止查出已软删除的数据。

## 3. 前端核心规范 (Vue 3 + Tailwind CSS + Element Plus)
- **代码风格**：一律使用 Composition API (`<script setup>`)，严禁使用 Options API。
- **组件导入**：Element Plus 已配置自动按需引入，**绝对禁止**在页面顶部手动 `import { ElButton, ... } from 'element-plus'`。
- **权限控制**：前端视图层控制按钮显隐，必须统一使用自定义指令 `v-permission="['权限标识']"`。
- **样式规范**：优先使用 Tailwind CSS 类名，暗黑模式切换必须通过全局 CSS 变量或 Tailwind 的 `dark:` 前缀实现，严禁写死颜色哈希值。