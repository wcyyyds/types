# 项目依赖介绍

> 本文档介绍 `web-2026-wcy` 工作区中两个项目的依赖包及其版本信息。

---

## 目录

- [Admin-Server（NestJS 后端）](#admin-servernestjs-后端)
- [vue-web（Vue 3 前端）](#vue-webvue-3-前端)
- [公共ts](#shared)

---

---

## 依赖

- 必须用pnpm安装依赖
---


## Admin-Server（NestJS 后端）

基于 **NestJS** 的 Node.js 后端服务，提供认证、文件上传、WebSocket 等功能。

### 生产依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| `@nestjs/common` | `^10.4.22` | NestJS 核心公共模块，包含装饰器、管道、守卫等 |
| `@nestjs/config` | `^3.3.0` | NestJS 配置模块，支持环境变量管理 |
| `@nestjs/core` | `^10.4.22` | NestJS 核心运行时 |
| `@nestjs/jwt` | `^10.2.0` | NestJS JWT 认证模块 |
| `@nestjs/platform-express` | `^10.4.22` | NestJS Express 平台适配 |
| `@nestjs/platform-socket.io` | `^10.4.22` | NestJS Socket.IO 平台适配 |
| `@nestjs/typeorm` | `^10.0.2` | NestJS TypeORM 集成模块 |
| `@nestjs/websockets` | `^10.4.22` | NestJS WebSocket 模块 |
| `bcrypt` | `^5.1.1` | 密码哈希加密库 |
| `class-transformer` | `^0.5.1` | 类转换工具，用于对象序列化/反序列化 |
| `class-validator` | `^0.14.4` | 基于装饰器的类验证器 |
| `dayjs` | `^1.11.20` | 轻量级日期处理库 |
| `multer` | `^2.1.1` | 文件上传中间件 |
| `mysql2` | `^3.12.1` | MySQL 数据库驱动 |
| `reflect-metadata` | `^0.2.2` | TypeScript 反射元数据 polyfill |
| `rxjs` | `^7.8.2` | 响应式编程库，NestJS 内部依赖 |
| `socket.io` | `^4.8.3` | WebSocket 通信库 |
| `typeorm` | `^0.3.22` | TypeScript ORM，支持 MySQL 等数据库 |

### 开发依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| `@nestjs/cli` | `^10.4.9` | NestJS 命令行工具 |
| `@nestjs/schematics` | `^10.2.3` | NestJS 代码生成器 |
| `@nestjs/testing` | `^10.4.22` | NestJS 测试工具模块 |
| `@types/bcrypt` | `^5.0.2` | bcrypt 类型定义 |
| `@types/express` | `^4.17.21` | Express 类型定义 |
| `@types/jest` | `^29.5.14` | Jest 类型定义 |
| `@types/node` | `^20.17.30` | Node.js 类型定义 |
| `@types/multer` | `^2.0.0` | multer 类型定义 |
| `@types/passport-jwt` | `^4.0.1` | passport-jwt 类型定义 |
| `@types/passport-local` | `^1.0.38` | passport-local 类型定义 |
| `@types/supertest` | `^6.0.3` | supertest 类型定义 |
| `@typescript-eslint/eslint-plugin` | `^6.21.0` | TypeScript ESLint 规则插件 |
| `@typescript-eslint/parser` | `^6.21.0` | TypeScript ESLint 解析器 |
| `eslint` | `^8.57.1` | JavaScript/TypeScript 代码检查工具 |
| `eslint-config-prettier` | `^10.1.8` | 关闭 ESLint 中与 Prettier 冲突的规则 |
| `eslint-plugin-prettier` | `^5.5.5` | 将 Prettier 作为 ESLint 规则运行 |
| `jest` | `^29.7.0` | JavaScript 测试框架 |
| `prettier` | `^3.5.3` | 代码格式化工具 |
| `source-map-support` | `^0.5.21` | Source map 支持 |
| `supertest` | `^6.3.4` | HTTP 断言测试库 |
| `ts-jest` | `^29.3.4` | TypeScript 的 Jest 预处理器 |
| `ts-loader` | `^9.5.7` | TypeScript Webpack 加载器 |
| `ts-node` | `^10.9.2` | TypeScript 运行时执行 |
| `tsconfig-paths` | `^4.2.0` | tsconfig 路径映射解析 |
| `typescript` | `^5.8.3` | TypeScript 编译器 |

---

## vue-web（Vue 3 前端）

基于 **Vue 3** 的现代化前端项目，使用 Vite 构建，集成 Element Plus、Pinia、Tailwind CSS 等。

### 生产依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| `@element-plus/icons-vue` | `^2.3.2` | Element Plus 图标库 |
| `@tailwindcss/vite` | `^4.3.0` | Tailwind CSS Vite 插件 |
| `axios` | `^1.16.1` | 基于 Promise 的 HTTP 客户端 |
| `element-plus` | `^2.14.0` | 基于 Vue 3 的 UI 组件库 |
| `pinia` | `^3.0.4` | Vue 状态管理库 |
| `tailwindcss` | `^4.3.0` | 原子化 CSS 框架 |
| `vue` | `^3.5.32` | Vue.js 前端框架 |
| `vue-router` | `^5.0.4` | Vue 官方路由管理器 |

### 开发依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| `@playwright/test` | `^1.59.1` | Playwright 端到端测试框架 |
| `@tsconfig/node24` | `^24.0.4` | Node 24 的 TypeScript 配置基准 |
| `@types/jsdom` | `^28.0.1` | jsdom 类型定义 |
| `@types/node` | `^24.12.2` | Node.js 类型定义 |
| `@vitejs/plugin-vue` | `^6.0.6` | Vite Vue 3 插件 |
| `@vitejs/plugin-vue-jsx` | `^5.1.5` | Vite Vue JSX 插件 |
| `@vitest/eslint-plugin` | `^1.6.16` | Vitest 的 ESLint 插件 |
| `@vue/eslint-config-typescript` | `^14.7.0` | Vue TypeScript ESLint 配置 |
| `@vue/test-utils` | `^2.4.6` | Vue 组件测试工具 |
| `@vue/tsconfig` | `^0.9.1` | Vue TypeScript 配置基准 |
| `eslint` | `^10.2.1` | JavaScript/TypeScript 代码检查工具 |
| `eslint-config-prettier` | `^10.1.8` | 关闭 ESLint 中与 Prettier 冲突的规则 |
| `eslint-plugin-oxlint` | `~1.60.0` | Oxlint ESLint 桥接插件 |
| `eslint-plugin-playwright` | `^2.10.1` | Playwright ESLint 规则 |
| `eslint-plugin-vue` | `~10.8.0` | Vue ESLint 规则插件 |
| `jiti` | `^2.6.1` | 运行时 TypeScript/ESM 加载器 |
| `jsdom` | `^29.0.2` | 浏览器环境的 JavaScript 实现 |
| `npm-run-all2` | `^8.0.4` | 并行/顺序运行 npm 脚本 |
| `oxfmt` | `^0.45.0` | Oxidation 格式化工具 |
| `oxlint` | `~1.60.0` | Rust 编写的快速 JavaScript linter |
| `sass` | `^1.99.0` | SCSS 预处理器 |
| `typescript` | `~6.0.0` | TypeScript 编译器 |
| `unplugin-auto-import` | `^21.0.0` | 自动导入 API 的 Vite 插件 |
| `unplugin-vue-components` | `^32.0.0` | 自动导入 Vue 组件的 Vite 插件 |
| `vite` | `^8.0.8` | 前端构建工具 |
| `vite-plugin-vue-devtools` | `^8.1.1` | Vue DevTools Vite 插件 |
| `vitest` | `^4.1.4` | Vite 原生测试框架 |
| `vue-tsc` | `^3.2.6` | Vue TypeScript 语言服务 |

---

## 核心依赖对比

| 类别 | Admin-Server | vue-web |
|------|-------------|---------|
| **框架** | NestJS `^10.4.22` | Vue `^3.5.32` |
| **语言** | TypeScript `^5.8.3` | TypeScript `~6.0.0` |
| **构建工具** | NestJS CLI `^10.4.9` | Vite `^8.0.8` |
| **数据库** | MySQL2 `^3.12.1` + TypeORM `^0.3.22` | — |
| **UI 组件** | — | Element Plus `^2.14.0` |
| **状态管理** | — | Pinia `^3.0.4` |
| **路由** | — | Vue Router `^5.0.4` |
| **HTTP 客户端** | — | Axios `^1.16.1` |
| **测试** | Jest `^29.7.0` | Vitest `^4.1.4` / Playwright `^1.59.1` |
| **代码检查** | ESLint `^8.57.1` | ESLint `^10.2.1` + Oxlint `~1.60.0` |
| **代码格式化** | Prettier `^3.5.3` | oxfmt `^0.45.0` |
| **CSS 方案** | — | Tailwind CSS `^4.3.0` + SCSS |
| **WebSocket** | Socket.IO `^4.8.3` | — |
