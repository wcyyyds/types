<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Refresh, Search, FolderOpened, Download, Fold, Expand } from '@element-plus/icons-vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import type { MenuInfo } from '@/types'
import { MenuTypeConst } from '@/types'
import { getMenuTreeApi, deleteMenuApi } from '@/api/menu'
import { downloadExport } from '@/utils'
import MenuFormDialog from './MenuFormDialog.vue'
import { useUserStore } from '@/stores/user'

/** 图标名称到组件的映射 */
const iconMap: Record<string, any> = ElementPlusIcons

onMounted(() => {
  fetchTree()
})

const loading = ref(false)
const treeData = ref<MenuInfo[]>([])
const searchText = ref('')
const treeRef = ref()
const treeExpandAll = ref(true)

function toggleTreeExpand() {
  treeExpandAll.value = !treeExpandAll.value
  const tree = treeRef.value
  if (!tree) return
  function walk(nodes: any[]) {
    if (!nodes) return
    for (const node of nodes) {
      if (treeExpandAll.value) {
        node.expand()
      } else {
        node.collapse()
      }
      if (node.childNodes) walk(node.childNodes)
    }
  }
  walk(tree.store?.root?.childNodes || [])
}

async function fetchTree() {
  loading.value = true
  treeData.value = []
  try {
    treeData.value = await getMenuTreeApi()
  } finally {
    loading.value = false
  }
}

/** 模糊搜索：递归过滤树节点 */
const filteredTree = computed(() => {
  if (!searchText.value.trim()) return treeData.value
  const keyword = searchText.value.trim().toLowerCase()

  function filterNodes(nodes: MenuInfo[]): MenuInfo[] {
    return nodes.reduce<MenuInfo[]>((acc, node) => {
      const matchTitle = node.title.toLowerCase().includes(keyword)
      const matchPerms = node.perms?.toLowerCase().includes(keyword)
      const matchPath = node.path?.toLowerCase().includes(keyword)
      const children = node.children ? filterNodes(node.children) : []
      if (matchTitle || matchPerms || matchPath || children.length > 0) {
        acc.push({ ...node, children: children.length > 0 ? children : node.children })
      }
      return acc
    }, [])
  }

  return filterNodes(treeData.value)
})

function handleRefresh() {
  searchText.value = ''
  fetchTree()
}

async function handleDelete(node: MenuInfo) {
  try {
    await ElMessageBox.confirm(`确定要删除菜单「${node.title}」吗？\n删除后子节点也将一并删除。`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteMenuApi(node.id as number)
    ElMessage.success('删除成功')
    fetchTree()
  } catch {
  }
}

const dialogRef = ref<InstanceType<typeof MenuFormDialog>>()
const dialogVisible = ref(false)

function openCreateDialog() {
  dialogRef.value?.openForCreate()
  dialogVisible.value = true
}

function openCreateChildDialog(node: MenuInfo) {
  dialogRef.value?.openForCreate(node)
  dialogVisible.value = true
}

function openEditDialog(node: MenuInfo) {
  dialogRef.value?.openForEdit(node)
  dialogVisible.value = true
}

async function handleExport() {
  await downloadExport('/menu/export', '菜单列表')
}

function handleDialogSuccess() {
  fetchTree()
}

/** 是否拥有菜单管理操作权限（新增、编辑或删除） */
const hasMenuActions = computed(() => {
  const perms = useUserStore().userInfo?.perms || []
  return perms.includes('menu:add') || perms.includes('menu:edit') || perms.includes('menu:delete')
})

/** 菜单类型标签映射 */
const typeMap: Record<number, { label: string; type: string }> = {
  [MenuTypeConst.DIRECTORY]: { label: '目录', type: 'warning' },
  [MenuTypeConst.MENU]: { label: '菜单', type: 'primary' },
  [MenuTypeConst.BUTTON]: { label: '按钮', type: 'info' },
}
</script>

<template>
  <div class="management-list">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" class="search-form">
        <el-form-item label="菜单名称">
          <el-input v-model="searchText" placeholder="输入菜单名称、权限标识或路径搜索" clearable style="width: 340px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">搜索</el-button>
          <el-button :icon="Refresh" @click="handleRefresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 树节点卡片 -->
    <el-card class="table-card" shadow="never">
      <div class="tree-header">
        <div class="tree-header-left">
          <span class="tree-header-title">菜单列表（{{ filteredTree.length }} 个根节点）</span>
          <span class="tree-header-hint" v-if="searchText">匹配 {{ filteredTree.flatMap(n => n.children || []).length + filteredTree.length }} 个节点</span>
        </div>
        <div class="tree-header-right">
          <el-tooltip :content="treeExpandAll ? '收起全部' : '展开全部'" placement="top">
            <el-button :icon="treeExpandAll ? Fold : Expand" @click="toggleTreeExpand" />
          </el-tooltip>
          <el-button :icon="Download" @click="handleExport" v-permission="'menu:export'">导出</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreateDialog" v-permission="'menu:add'">新增菜单</el-button>
        </div>
      </div>
      <el-tree
        ref="treeRef"
        :data="filteredTree"
        :props="{ label: 'title', children: 'children' }"
        node-key="id"
        :default-expand-all="!searchText"
        :filter-node-method="() => true"
        :highlight-current="false"
        v-loading="loading"
        class="menu-tree"
      >
        <template #default="{ data }">
          <div class="tree-node">
            <div class="tree-node-info">
              <template v-if="data.type !== MenuTypeConst.BUTTON">
                <el-icon v-if="data.icon && iconMap[data.icon]" :size="18" class="node-icon"><component :is="iconMap[data.icon]" /></el-icon>
                <el-icon v-else :size="18" class="node-icon-placeholder"><FolderOpened /></el-icon>
              </template>
              <span class="tree-node-title">{{ data.title }}</span>
              <el-tag :type="typeMap[data.type]?.type as any" effect="light" size="small" class="node-type-tag">
                {{ typeMap[data.type]?.label }}
              </el-tag>
              <span v-if="data.perms" class="tree-node-perms">{{ data.perms }}</span>
            </div>
            <div class="tree-node-meta">
              <span v-if="data.path" class="tree-node-path">{{ data.path }}</span>
              <span class="tree-node-sort">排序: {{ data.sort }}</span>
              <el-tag v-if="!data.isActive" type="danger" effect="plain" size="small">已禁用</el-tag>
            </div>
            <div class="tree-node-actions" @click.stop v-if="hasMenuActions">
              <el-button v-if="data.type !== MenuTypeConst.BUTTON" type="primary" link size="small" :icon="Plus"
                @click="openCreateChildDialog(data)" v-permission="'menu:add'">
                添加子级
              </el-button>
              <el-button type="primary" link size="small" :icon="Edit"
                @click="openEditDialog(data)" v-permission="'menu:edit'">
                编辑
              </el-button>
              <el-button type="danger" link size="small" :icon="Delete"
                @click="handleDelete(data)" v-permission="'menu:delete'">
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
      <el-empty v-if="!loading && filteredTree.length === 0" description="暂无菜单数据" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <MenuFormDialog ref="dialogRef" v-model="dialogVisible" @success="handleDialogSuccess" />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 树头部统计 + 操作按钮 */
.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 12px;
  border-bottom: 1px solid var(--border-color-light);
  margin-bottom: 4px;
}

.tree-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tree-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.tree-header-hint {
  font-size: 12px;
  color: var(--primary);
  background: var(--primary-bg);
  padding: 2px 10px;
  border-radius: 10px;
}

/* 树节点自定义内容 */
.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 4px 12px 4px 4px;
  gap: 12px;
}

.tree-node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
}

.node-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.node-icon-placeholder {
  color: var(--text-color-tertiary);
  flex-shrink: 0;
}

.tree-node-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color);
  white-space: nowrap;
}

.node-type-tag {
  flex-shrink: 0;
}

.tree-node-perms {
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 11px;
  color: var(--primary);
  background: var(--primary-bg);
  padding: 1px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

/* 中间元信息 */
.tree-node-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--text-color-tertiary);
}

.tree-node-path {
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.tree-node-sort {
  white-space: nowrap;
  flex-shrink: 0;
}

/* 操作按钮 — 始终显示 */
.tree-node-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* el-tree 样式覆盖 */
.menu-tree :deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
  border-radius: var(--radius-md);
  margin: 1px 0;
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}

.menu-tree :deep(.el-tree-node__content:hover) {
  background: var(--sidebar-hover-bg);
  border-color: var(--border-color);
}

.menu-tree :deep(.el-tree-node__label) {
  flex: 1;
  overflow: visible;
}

/* 让 el-card__body 不滚动，由 el-tree 内部滚动 */
.management-list .table-card .el-card__body {
  overflow: hidden;
}

.menu-tree {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* 搜索卡片 */
.search-card :deep(.el-form) {
  margin-bottom: 0;
}

.search-card :deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
