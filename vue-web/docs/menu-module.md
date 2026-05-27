# 菜单管理模块 (Menu)

## 概述

菜单 CRUD、树形结构、图标选择、Excel 导出。

## 数据模型

- **Menu**：菜单表
- 支持三级类型：1=目录、2=菜单、3=按钮
- 通过 `parentId` 实现无限层级树形结构

## 菜单类型常量

```typescript
export const MenuTypeConst = {
  DIRECTORY: 1,  // 目录
  MENU: 2,       // 菜单
  BUTTON: 3,     // 按钮
}
```

## 接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/menu/tree` | 获取菜单树 | menu:list |
| GET | `/api/menu/list` | 获取扁平列表 | menu:list |
| POST | `/api/menu/create` | 新增菜单 | menu:add |
| PUT | `/api/menu/update` | 更新菜单 | menu:edit |
| DELETE | `/api/menu/delete` | 删除菜单（有子节点不允许删除） | menu:delete |
| POST | `/api/menu/export` | 导出 Excel | menu:export |

## 特殊业务逻辑

### 菜单树构建
后端 `MenuService.buildTree()` 将扁平列表转为树形结构，同级别按 `sort` 升序排列。

### 搜索时树结构完整
搜索关键词时，后端自动补充匹配节点的所有祖先节点，保证返回的树结构完整可展开。

### 删除限制
如果菜单有子节点，不允许删除，需先删除所有子节点。

### 新增子级规则
| 上级类型 | 可新增的子级类型 |
|---------|----------------|
| 目录 (1) | 目录、菜单 |
| 菜单 (2) | 按钮 |
| 按钮 (3) | 不允许添加子级 |

## 前端相关

- `src/api/menu.ts` — API 定义
- `src/views/menu/MenuManagement.vue` — 树形列表页
- `src/views/menu/MenuFormDialog.vue` — 新增/编辑弹窗

### MenuManagement.vue

- 树形展示所有菜单，支持模糊搜索
- 每个节点显示：图标、名称、类型标签、权限标识、路径、排序
- 操作按钮：添加子级、编辑、删除
- **添加子级**：只有目录和菜单显示此按钮
- 表头有展开/收起全部按钮

### MenuFormDialog.vue 表单行为

| 场景 | 上级菜单 | 类型选项 | 类型可改？ |
|------|---------|---------|-----------|
| 新增顶级 | 不显示 | 目录、菜单 | ✅ |
| 从目录添加子级 | 显示（只读） | 目录、菜单 | ✅ |
| 从菜单添加子级 | 显示（只读） | 仅按钮 | ❌ |
| 编辑 | 显示（只读） | 全部类型 | ❌ |

### 图标选择
- 使用 `import * as ElementPlusIcons` 获取所有 Element Plus 图标
- `iconOptions` 通过 `Object.keys(iconsMap)` 动态获取所有图标名称
- 下拉选项中用 `<component :is="iconsMap[iconName]" />` 渲染图标预览

### 必填校验
- 目录类型：菜单名称必填
- 菜单类型：菜单名称、路由路径、组件路径必填
- 按钮类型：菜单名称、权限标识必填
