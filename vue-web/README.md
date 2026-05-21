
## 📁 目录结构说明

```
vue-web/
├── .vscode/                    # VS Code 配置
│   └── extensions.json         # 推荐的扩展
├── e2e/                        # E2E 测试
│   ├── vue.spec.ts             # E2E 测试用例
│   └── tsconfig.json           # E2E TypeScript 配置
├── public/                     # 静态资源
│   └── favicon.ico             # 网站图标
├── src/                        # 源代码
│   ├── api/                    # API 请求层
│   │   └── index.ts            # Axios 实例与请求封装
│   ├── assets/                 # 静态资源（图片、字体等）
│   ├── components/             # 公共组件
│   │   └── ThemeToggle.vue     # 主题切换组件
│   ├── composables/            # 组合式函数
│   │   └── useTheme.ts         # 主题切换逻辑
│   ├── layouts/                # 布局组件
│   │   ├── AdminLayout.vue     # 管理后台布局
│   │   └── AuthLayout.vue      # 认证页面布局
│   ├── router/                 # 路由配置
│   │   └── index.ts            # 路由定义与守卫
│   ├── stores/                 # Pinia 状态管理
│   │   ├── counter.ts          # 示例 Store
│   │   ├── user.ts             # 用户认证 Store
│   │   └── theme.ts            # 主题 Store
│   ├── styles/                 # 全局样式
│   │   ├── variables.scss      # SCSS 变量
│   │   ├── reset.scss          # 样式重置
│   │   └── theme.scss          # 主题样式
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts            # 全局类型
│   ├── utils/                  # 工具函数
│   │   └── index.ts            # 通用工具函数
│   ├── views/                  # 页面视图
│   │   ├── login/              # 登录模块
│   │   │   └── LoginView.vue   # 登录页面
│   │   └── dashboard/          # 仪表盘模块
│   │       └── DashboardView.vue # 首页仪表盘
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 应用入口
├── .editorconfig               # 编辑器配置
├── .gitattributes              # Git 属性配置
├── .gitignore                  # Git 忽略规则
├── .oxfmtrc.json               # Oxfmt 格式化配置
├── .oxlintrc.json              # Oxlint 配置
├── auto-imports.d.ts           # 自动导入类型声明
├── components.d.ts             # 组件自动导入类型声明
├── env.d.ts                    # 环境变量类型声明
├── eslint.config.ts            # ESLint 配置
├── index.html                  # HTML 入口
├── package.json                # 项目依赖
├── playwright.config.ts        # Playwright 配置
├── pnpm-lock.yaml              # pnpm 锁文件
├── pnpm-workspace.yaml         # pnpm 工作区配置
├── STACK.md                    # 本技术栈文档
├── tsconfig.json               # TypeScript 主配置
├── tsconfig.app.json           # 应用 TypeScript 配置
├── tsconfig.node.json          # Node TypeScript 配置
├── tsconfig.vitest.json        # Vitest TypeScript 配置
├── vite.config.ts              # Vite 构建配置
└── vitest.config.ts            # Vitest 测试配置
```
