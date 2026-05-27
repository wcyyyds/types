# 认证模块 (Auth)

## 概述

基于自研 Token 认证（非 JWT），使用 UUID v4 生成随机 token，存储在 Redis。

## 核心流程

```
Login → 验证密码 → 生成 UUID token → 存入 Redis (Hash) → 返回 accessToken
Request → TokenAuthGuard → HGETALL token:{accessToken} → 验证通过
```

## Token 格式

`tok_` 前缀 + UUID（无连字符），如 `tok_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Redis Key 模式

| Key | 类型 | 用途 |
|-----|------|------|
| `token:{accessToken}` | Hash | Token 验证，O(1) 直查 |
| `user_tokens:{userId}` | Set | 用户 token 索引，用于单点登录和强制登出 |
| `perms:{userId}` | String | 缓存的权限列表 |

## 单点登录

同一账号仅保留一个有效 token，新登录会清除旧 token。

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，返回 accessToken + roles + perms + menus |
| POST | `/api/auth/logout` | 正常登出，清除当前 token |
| POST | `/api/auth/logout/force` | 强制登出，通过 userId 清除所有服务端数据 |

## 前端相关

- `src/api/login.ts` — 登录/登出 API
- `src/stores/user.ts` — Pinia store，管理用户状态（userInfo、token、isLoggedIn）
- `src/utils/index.ts` — `tokenManager` 封装 token 的本地存储读写
- `src/router/index.ts` — 路由守卫，基于 token 存在性判断登录状态

### 登录流程

1. 用户提交用户名密码
2. `userStore.login()` 调用 `loginApi()`
3. 后端返回 `accessToken` + 用户信息 + 角色/权限/菜单
4. 存入 Pinia store 和 localStorage
5. 跳转 `/dashboard`

### 401 处理

在 `src/api/index.ts` 的响应拦截器中统一处理：
- 弹出确认框提示"登录已失效"
- 用户确认后调用 `forceLogoutApi` 通知后端清理
- 清除本地缓存，跳转登录页
