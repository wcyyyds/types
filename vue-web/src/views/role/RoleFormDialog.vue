<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Fold, Expand, Select, Delete, Close } from '@element-plus/icons-vue'
import type { RoleInfo, CreateRoleParams, UpdateRoleParams, MenuInfo } from '@/types'
import { createRoleApi, updateRoleApi, getRoleMenuIdsApi, assignRoleMenusApi } from '@/api/role'
import { getMenuTreeApi } from '@/api/menu'

// ============================================================
// Props & Emits
// ============================================================

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
  success: []
}>()

// ============================================================
// 状态
// ============================================================

const isEdit = ref(false)
const loading = ref(false)
const menuLoading = ref(false)
const allMenus = ref<MenuInfo[]>([])
const selectedMenuIds = ref<number[]>([])
const menuSearchText = ref('')
const menuTreeRef = ref()

/** 树过滤方法（前端过滤，不改动数据源，不丢失勾选） */
function treeFilterNode(value: string, data: MenuInfo): boolean {
  if (!value) return true
  return data.title.toLowerCase().includes(value.toLowerCase())
}

/** 搜索输入变化时触发 el-tree 过滤 */
function handleMenuSearch(val: string) {
  menuTreeRef.value?.filter(val)
}

/** 从 el-tree 获取完全选中的节点 ID（不含半选父节点） */
function getStrictCheckedIds(): number[] {
  return menuTreeRef.value?.getCheckedKeys() || []
}

/** 树勾选变更时同步 selectedMenuIds 和计数 */
function handleTreeCheck() {
  selectedMenuIds.value = getStrictCheckedIds()
  syncStrictCount()
}

/** 完全选中的节点数（用于右侧展示，不含半选父节点） */
const strictCheckedCount = ref(0)

/** 已选中的菜单项对应的标题列表（用于右侧展示，只展示完全选中的节点） */
const selectedMenuTitles = computed(() => {
  if (!allMenus.value.length || !strictCheckedCount.value) return []
  const checkedKeys = getStrictCheckedIds()
  const checkedSet = new Set(checkedKeys)
  const titles: { id: number; title: string; type: number }[] = []
  function walk(nodes: MenuInfo[]) {
    for (const node of nodes) {
      if (checkedSet.has(node.id!)) {
        titles.push({ id: node.id!, title: node.title, type: node.type })
      }
      if (node.children) walk(node.children)
    }
  }
  walk(allMenus.value)
  return titles
})

/** 同步 strictCheckedCount */
function syncStrictCount() {
  strictCheckedCount.value = getStrictCheckedIds().length
}

const formRef = ref()
const formData = reactive<{
  id?: number
  roleName: string
  roleCode: string
  sort: number
  isActive: boolean
  remark: string
}>({
  roleName: '',
  roleCode: '',
  sort: 0,
  isActive: true,
  remark: '',
})

const formRules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度 2-50 个字符', trigger: 'blur' },
  ],
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 50, message: '角色编码长度 2-50 个字符', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_]+$/, message: '角色编码只能包含字母、数字和下划线', trigger: 'blur' },
  ],
}

const dialogTitle = ref('')
const treeExpandAll = ref(true)

// ============================================================
// 方法
// ============================================================

/** 加载所有菜单树 */
async function loadMenus() {
  try {
    allMenus.value = await getMenuTreeApi()
  } catch {}
}

/** 加载角色已分配的菜单 */
async function loadRoleMenus(roleId: number) {
  menuLoading.value = true
  try {
    selectedMenuIds.value = await getRoleMenuIdsApi(roleId)
  } catch {
    selectedMenuIds.value = []
  } finally {
    menuLoading.value = false
  }
}

async function openForCreate() {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  formData.id = undefined
  formData.roleName = ''
  formData.roleCode = ''
  formData.sort = 0
  formData.isActive = true
  formData.remark = ''
  selectedMenuIds.value = []
  strictCheckedCount.value = 0
  menuSearchText.value = ''
  treeExpandAll.value = true
  await loadMenus()
  await nextTick()
  menuTreeRef.value?.setCheckedKeys([])
  syncStrictCount()
}

async function openForEdit(row: RoleInfo) {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  formData.id = row.id
  formData.roleName = row.roleName
  formData.roleCode = row.roleCode
  formData.sort = row.sort
  formData.isActive = row.isActive
  formData.remark = row.remark || ''
  selectedMenuIds.value = []
  strictCheckedCount.value = 0
  menuSearchText.value = ''
  treeExpandAll.value = true
  await Promise.all([
    loadMenus(),
    row.id ? loadRoleMenus(row.id) : Promise.resolve(),
  ])
  await nextTick()
  if (menuTreeRef.value) {
    menuTreeRef.value.setCheckedKeys(selectedMenuIds.value)
    syncStrictCount()
  }
}

/** 展开/折叠所有树节点 */
function toggleTreeExpand() {
  treeExpandAll.value = !treeExpandAll.value
  const tree = menuTreeRef.value
  if (!tree) return
  // 递归遍历所有节点
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

/** 从已选列表中移除某个权限 */
function removePerm(id: number) {
  if (!menuTreeRef.value) return
  // 父子联动下，直接 setCheckedKeys 过滤掉该 id 即可
  const next = selectedMenuIds.value.filter(i => i !== id)
  menuTreeRef.value.setCheckedKeys(next)
  handleTreeCheck()
  syncStrictCount()
}

/** 全选/取消全选 */
function toggleSelectAll() {
  if (!menuTreeRef.value) return
  if (selectedMenuIds.value.length > 0) {
    menuTreeRef.value.setCheckedKeys([])
  } else {
    // 获取所有可见节点（未被 el-tree 过滤的节点）的 ID
    const allIds: number[] = []
    const root = menuTreeRef.value.store?.root
    if (root) {
      function walk(node: any) {
        if (!node) return
        if (node.visible !== false && node.key !== undefined) {
          allIds.push(node.key)
        }
        if (node.childNodes) {
          node.childNodes.forEach((child: any) => walk(child))
        }
      }
      root.childNodes?.forEach((child: any) => walk(child))
    }
    menuTreeRef.value.setCheckedKeys(allIds)
  }
  handleTreeCheck()
  syncStrictCount()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()

  loading.value = true
  try {
    if (isEdit.value) {
      const params: UpdateRoleParams = {
        id: formData.id!,
        roleName: formData.roleName,
        roleCode: formData.roleCode,
        sort: formData.sort,
        isActive: formData.isActive,
        remark: formData.remark || undefined,
      }
      await updateRoleApi(params)
      // 分配菜单权限
      if (formData.id) {
        await assignRoleMenusApi(formData.id, getStrictCheckedIds())
      }
      ElMessage.success('更新成功')
    } else {
      const params: CreateRoleParams = {
        roleName: formData.roleName,
        roleCode: formData.roleCode,
        sort: formData.sort,
        isActive: formData.isActive,
        remark: formData.remark || undefined,
      }
      const saved = await createRoleApi(params)
      // 新增角色后分配菜单权限
      if (saved?.id) {
        await assignRoleMenusApi(saved.id, getStrictCheckedIds())
      }
      ElMessage.success('新增成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } catch {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}

defineExpose({ openForCreate, openForEdit })
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px" class="dialog-form" style="height:100%;display:flex;flex-direction:column;">
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="form-section-title">基本信息</div>
        <div class="form-section-body">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="角色名称" prop="roleName">
                <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色编码" prop="roleCode">
                <el-input v-model="formData.roleCode" placeholder="如: FINANCE_STAFF" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="显示顺序" prop="sort">
                <el-input-number v-model="formData.sort" :min="0" :max="999"/>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色状态">
                <el-switch v-model="formData.isActive" active-text="正常" inactive-text="停用" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注（选填）" />
          </el-form-item>
        </div>
      </div>

      <!-- 权限配置 -->
      <div class="form-section">
        <div class="form-section-title">
          权限配置
          <span class="section-badge" v-if="strictCheckedCount">{{ strictCheckedCount }} 项</span>
        </div>
        <div class="form-section-body">
          <div class="perm-layout">
            <!-- 左侧：菜单树 -->
            <div class="perm-tree-area">
              <div class="perm-toolbar">
                <el-input
                  v-model="menuSearchText"
                  placeholder="搜索菜单名称"
                  clearable
                  size="small"
                  prefix-icon="Search"
                  @input="handleMenuSearch"
                />
                <el-button-group class="perm-actions">
                  <el-tooltip content="展开/折叠" placement="top">
                    <el-button size="small" @click="toggleTreeExpand">
                      <el-icon><Fold v-if="treeExpandAll" /><Expand v-else /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="全选/取消" placement="top">
                    <el-button size="small" @click="toggleSelectAll">
                      <el-icon><Select /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="清空" placement="top">
                    <el-button size="small" @click="selectedMenuIds = []; menuTreeRef?.setCheckedKeys([]); syncStrictCount()">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </el-button-group>
              </div>
              <el-tree
                ref="menuTreeRef"
                :data="allMenus"
                :props="{ label: 'title', children: 'children' }"
                node-key="id"
                show-checkbox
                check-strictly
                :filter-node-method="treeFilterNode"
                v-loading="menuLoading"
                default-expand-all
                class="perm-tree"
                @check="handleTreeCheck"
              />
              <div v-if="!menuLoading && allMenus.length === 0" class="perm-empty">
                <el-empty description="暂无菜单数据" :image-size="50" />
              </div>
            </div>
            <!-- 右侧：已选列表 -->
            <div class="perm-sidebar">
              <div class="perm-sidebar-header">
                <span>已选权限</span>
                <el-tag size="small" type="primary" effect="plain">{{ strictCheckedCount }}</el-tag>
              </div>
              <div class="perm-sidebar-list">
                <template v-if="selectedMenuTitles.length">
                  <div
                    v-for="item in selectedMenuTitles"
                    :key="item.id"
                    class="perm-sidebar-item"
                    :class="`type-${item.type}`"
                  >
                    <span class="perm-sidebar-label">{{ item.title }}</span>
                    <el-tag size="small" :type="item.type === 3 ? 'info' : item.type === 2 ? 'primary' : 'warning'" effect="plain">
                      {{ { 1: '目录', 2: '菜单', 3: '按钮' }[item.type] }}
                    </el-tag>
                    <el-button
                      link
                      type="danger"
                      size="small"
                      class="perm-sidebar-remove"
                      @click="removePerm(item.id)"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                </template>
                <el-empty v-else description="暂未选择权限" :image-size="40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ isEdit ? '保存修改' : '确认新增' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>

/* 表单分区 */
.form-section {
  margin-bottom: 20px;
}

.form-section:last-child {
  margin-bottom: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.form-section:last-child .form-section-body {
  height: 275px;
  min-height: 0;
}

.form-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color-secondary);
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 1px dashed var(--border-color-light);
  letter-spacing: 0.5px;
}

.form-section-body :deep(.el-form-item) {
  margin-bottom: 18px;
}

.form-section-body :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.form-section-body > :deep(.el-row) {
  margin-bottom: 18px;
}

.form-section-body > :deep(.el-row:last-child) {
  margin-bottom: 0;
}

.form-section-body :deep(.el-col) .el-form-item {
  margin-bottom: 0;
}

/* ===== 权限配置 - 左右布局 ===== */
.section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  background: var(--primary);
  border-radius: 10px;
  margin-left: 8px;
  vertical-align: middle;
}

.perm-layout {
  display: flex;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

/* 左侧：树区域 */
.perm-tree-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-color-muted);
  overflow: hidden;
}

.perm-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.perm-toolbar .el-input {
  flex: 1;
}

.perm-actions {
  flex-shrink: 0;
}

.perm-tree {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
  background: var(--bg-color-container);
}

.perm-tree :deep(.el-tree-node__content) {
  height: 34px;
  border-radius: var(--radius-sm);
  margin: 0 4px;
  transition: background var(--transition-fast);
}

.perm-tree :deep(.el-tree-node__content:hover) {
  background: var(--sidebar-hover-bg);
}

.perm-tree :deep(.el-tree-node__content .el-tree-node__label) {
  font-size: 13px;
}

.perm-empty {
  padding: 20px 0;
}

/* 右侧：已选列表 */
.perm-sidebar {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-color-muted);
  overflow: hidden;
}

.perm-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-secondary);
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.perm-sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.perm-sidebar-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  margin-bottom: 4px;
  border-radius: var(--radius-sm);
  background: var(--bg-color-container);
  transition: background var(--transition-fast);
  cursor: default;
}

.perm-sidebar-item:hover {
  background: var(--sidebar-hover-bg);
}

.perm-sidebar-item:hover .perm-sidebar-remove {
  opacity: 1;
}

.perm-sidebar-label {
  flex: 1;
  font-size: 12px;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.perm-sidebar-remove {
  opacity: 0;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
  margin-left: auto;
}
</style>
