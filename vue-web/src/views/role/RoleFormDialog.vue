<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { RoleInfo, CreateRoleParams, UpdateRoleParams } from '@/types'
import { createRoleApi, updateRoleApi } from '@/api/role'

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

// ============================================================
// 方法
// ============================================================

function openForCreate() {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  formData.id = undefined
  formData.roleName = ''
  formData.roleCode = ''
  formData.sort = 0
  formData.isActive = true
  formData.remark = ''
}

function openForEdit(row: RoleInfo) {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  formData.id = row.id
  formData.roleName = row.roleName
  formData.roleCode = row.roleCode
  formData.sort = row.sort
  formData.isActive = row.isActive
  formData.remark = row.remark || ''
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
      ElMessage.success('更新成功')
    } else {
      const params: CreateRoleParams = {
        roleName: formData.roleName,
        roleCode: formData.roleCode,
        sort: formData.sort,
        isActive: formData.isActive,
        remark: formData.remark || undefined,
      }
      await createRoleApi(params)
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
    width="520px"
    :close-on-click-modal="false"
    class="role-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" class="dialog-form">
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="formData.roleName" placeholder="请输入角色名称" autocomplete="off" />
      </el-form-item>
      <el-form-item label="角色编码" prop="roleCode">
        <el-input v-model="formData.roleCode" placeholder="请输入角色编码（如: FINANCE_STAFF）" autocomplete="off" />
      </el-form-item>
      <el-form-item label="显示顺序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :max="999" style="width: 100%" />
      </el-form-item>
      <el-form-item label="角色状态">
        <el-switch v-model="formData.isActive" active-text="正常" inactive-text="停用" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注（选填）" />
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
.role-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid var(--border-color-light);
}

.role-dialog :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
}

.role-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.role-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid var(--border-color-light);
}

.dialog-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
