<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { MenuInfo, CreateMenuParams, UpdateMenuParams, MenuType } from '@/types'
import { MenuTypeConst } from '@/types'
import { createMenuApi, updateMenuApi, getMenuTreeApi } from '@/api/menu'
import * as ElementPlusIcons from '@element-plus/icons-vue'

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
const parentMenus = ref<any[]>([])
/** 新增子级时上级菜单的类型（用于过滤可选的类型选项） */
const parentType = ref<number | null>(null)

const formRef = ref()
const formData = reactive<{
  id?: number
  parentId: number | null
  title: string
  type: number
  path: string
  component: string
  perms: string
  icon: string
  sort: number
  isActive: boolean
  remark: string
}>({
  parentId: null,
  title: '',
  type: MenuTypeConst.DIRECTORY,
  path: '',
  component: '',
  perms: '',
  icon: '',
  sort: 0,
  isActive: true,
  remark: '',
})

const formRules = computed(() => ({
  title: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 50, message: '菜单名称长度 2-50 个字符', trigger: 'blur' },
  ],
  path: formData.type === MenuTypeConst.MENU
    ? [{ required: true, message: '请输入路由路径', trigger: 'blur' }]
    : [],
  component: formData.type === MenuTypeConst.MENU
    ? [{ required: true, message: '请输入组件路径', trigger: 'blur' }]
    : [],
  perms: [
    {
      pattern: /^[a-zA-Z0-9_:]+$/,
      message: '权限标识格式不正确（字母、数字、下划线、冒号）',
      trigger: 'blur',
    },
  ],
}))

const dialogTitle = ref('')

const typeOptions = [
  { value: MenuTypeConst.DIRECTORY, label: '目录' },
  { value: MenuTypeConst.MENU, label: '菜单' },
  { value: MenuTypeConst.BUTTON, label: '按钮' },
]

/** 根据是否有上级菜单过滤可选的类型选项 */
const availableTypeOptions = computed(() => {
  // 编辑时显示全部类型（禁用不可选）
  if (isEdit.value) return typeOptions
  // 无上级时只能选目录或菜单
  if (parentType.value === null) {
    return typeOptions.filter((opt) => opt.value !== MenuTypeConst.BUTTON)
  }
  // 上级是目录时可选目录或菜单
  if (parentType.value === MenuTypeConst.DIRECTORY) {
    return typeOptions.filter((opt) => opt.value !== MenuTypeConst.BUTTON)
  }
  // 上级是菜单时只能选按钮
  return typeOptions.filter((opt) => opt.value === MenuTypeConst.BUTTON)
})

/** 图标名称到组件实例的映射 */
const iconsMap = ElementPlusIcons as Record<string, any>

/** 所有 Element Plus 图标名称（过滤掉非图标导出） */
const iconOptions = Object.keys(iconsMap).filter(
  (name) => name !== 'default' && typeof iconsMap[name] === 'object',
)

onMounted(async () => {
  try {
    const data = await getMenuTreeApi()
    // 手动构建纯对象，只保留 el-tree-select 需要的字段，切断所有响应式引用
    parentMenus.value = buildPlainTree(data)
  } catch {}
})

/** 递归构建纯对象树，只保留 id/title/children，避免 component 等字段引发循环引用 */
function buildPlainTree(nodes: MenuInfo[]): { id?: number; title: string; children: any[] }[] {
  return nodes.map((node) => ({
    id: node.id,
    title: node.title,
    children: node.children ? buildPlainTree(node.children) : [],
  }))
}

/** 根据 parentId 查找父菜单名称 */
const parentMenuName = computed(() => {
  if (formData.parentId === null) return ''
  function find(nodes: any[]): string {
    for (const node of nodes) {
      if (node.id === formData.parentId) return node.title
      if (node.children?.length) {
        const result = find(node.children)
        if (result) return result
      }
    }
    return ''
  }
  return find(parentMenus.value)
})

// ============================================================
// 方法
// ============================================================

function resetForm() {
  formData.id = undefined
  formData.parentId = null
  formData.title = ''
  formData.type = MenuTypeConst.DIRECTORY
  formData.path = ''
  formData.component = ''
  formData.perms = ''
  formData.icon = ''
  formData.sort = 0
  formData.isActive = true
  formData.remark = ''
}

function openForCreate(parent?: MenuInfo) {
  isEdit.value = false
  dialogTitle.value = parent ? `新增子菜单 - ${parent.title}` : '新增菜单'
  resetForm()
  formData.parentId = parent?.id ?? null
  // 有上级时：上级是菜单则新增按钮，上级是目录则默认新增菜单（可选目录或菜单）
  // 无上级时：新增目录
  if (parent) {
    parentType.value = parent.type
    formData.type = parent.type === MenuTypeConst.MENU ? MenuTypeConst.BUTTON : MenuTypeConst.MENU
  } else {
    parentType.value = null
  }
  formRef.value?.clearValidate()
}

function openForEdit(row: MenuInfo) {
  isEdit.value = true
  parentType.value = null
  dialogTitle.value = '编辑菜单'
  formData.id = row.id
  formData.parentId = row.parentId === 0 ? null : row.parentId
  formData.title = row.title
  formData.type = row.type
  formData.path = row.path || ''
  formData.component = row.component || ''
  formData.perms = row.perms || ''
  formData.icon = row.icon || ''
  formData.sort = row.sort
  formData.isActive = row.isActive
  formData.remark = row.remark || ''
  formRef.value?.clearValidate()
}

/** 从表单数据构建请求参数 */
function buildParams(): CreateMenuParams {
  return {
    parentId: formData.parentId ?? 0,
    title: formData.title,
    type: formData.type as MenuType,
    path: formData.path || undefined,
    component: formData.component || undefined,
    perms: formData.perms || undefined,
    icon: formData.icon || undefined,
    sort: formData.sort,
    isActive: formData.isActive,
    remark: formData.remark || undefined,
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()

  loading.value = true
  try {
    if (isEdit.value) {
      await updateMenuApi({ ...buildParams(), id: formData.id! })
      ElMessage.success('更新成功')
    } else {
      await createMenuApi(buildParams())
      ElMessage.success('新增成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } catch {
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
    width="600px"
    :close-on-click-modal="false"
    class="menu-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" class="dialog-form">
      <el-form-item label="上级菜单" prop="parentId" v-if="isEdit || formData.parentId !== null">
        <el-input :model-value="parentMenuName" disabled placeholder="顶级菜单（无上级）" />
      </el-form-item>
      <el-form-item label="菜单类型" prop="type">
        <el-radio-group v-model="formData.type" :disabled="isEdit">
          <el-radio-button v-for="opt in availableTypeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="菜单名称" prop="title">
        <el-input v-model="formData.title" placeholder="请输入菜单名称" />
      </el-form-item>
      <el-form-item label="图标" prop="icon" v-if="formData.type !== MenuTypeConst.BUTTON">
        <el-select v-model="formData.icon" placeholder="请选择图标" clearable filterable style="width: 100%">
          <el-option v-for="iconName in iconOptions" :key="iconName" :label="iconName" :value="iconName">
            <span style="display: flex; align-items: center; gap: 8px;">
              <el-icon :size="16"><component :is="iconsMap[iconName]" v-if="iconName && iconsMap[iconName]" /></el-icon>
              <span>{{ iconName }}</span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="formData.type === MenuTypeConst.MENU" label="路由路径" prop="path">
        <el-input v-model="formData.path" placeholder="如: /system/user" />
      </el-form-item>
      <el-form-item v-if="formData.type === MenuTypeConst.MENU" label="组件路径" prop="component">
        <el-input v-model="formData.component" placeholder="如: system/user/index.vue" />
      </el-form-item>
      <el-form-item v-if="formData.type === MenuTypeConst.BUTTON" label="权限标识" prop="perms">
        <el-input v-model="formData.perms" placeholder="如: user:add" />
      </el-form-item>
      <el-form-item label="显示顺序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :max="999" style="width: 100%" />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="formData.isActive" active-text="启用" inactive-text="禁用" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注（选填）" />
      </el-form-item>
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
.menu-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid var(--border-color-light);
}

.menu-dialog :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
}

.menu-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.menu-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid var(--border-color-light);
}

.dialog-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
