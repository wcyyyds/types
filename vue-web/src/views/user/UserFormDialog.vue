<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserInfo, CreateUserParams, UpdateUserParams } from '@/types'
import { createUserApi, updateUserApi } from '@/api/user'

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
  userName: string
  passWord: string
  email: string
  phone: string
  isActive: boolean
}>({
  userName: '',
  passWord: '',
  email: '',
  phone: '',
  isActive: true,
})

/** 邮箱正则（允许为空） */
const EMAIL_REGEX = /^(?:$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$)/

/** 手机号正则（允许为空） */
const PHONE_REGEX = /^(?:$|^(?:(?:\+|00)86)?1(?:(?:3[\d])|(?:4[5-79])|(?:5[0-35-9])|(?:6[5-7])|(?:7[0-8])|(?:8[\d])|(?:9[1589]))\d{8}$)/

const formRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度 2-50 个字符', trigger: 'blur' },
  ],
  passWord: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度 6-50 个字符', trigger: 'blur' },
  ],
  email: [
    {
      pattern: EMAIL_REGEX,
      message: '请输入正确的邮箱地址',
      trigger: 'blur',
    },
  ],
  phone: [
    {
      pattern: PHONE_REGEX,
      message: '请输入正确的手机号',
      trigger: 'blur',
    },
  ],
}

const dialogTitle = ref('')

// ============================================================
// 方法
// ============================================================

function openForCreate() {
  isEdit.value = false
  dialogTitle.value = '新增用户'
  formData.id = undefined
  formData.userName = ''
  formData.passWord = ''
  formData.email = ''
  formData.phone = ''
  formData.isActive = true
}

function openForEdit(row: UserInfo) {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  formData.id = row.id
  formData.userName = row.userName
  formData.passWord = ''
  formData.email = row.email || ''
  formData.phone = row.phone || ''
  formData.isActive = row.isActive
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()

  loading.value = true
  try {
    if (isEdit.value) {
      const params: UpdateUserParams = {
        id: formData.id!,
        userName: formData.userName,
        email: formData.email,
        phone: formData.phone,
        isActive: formData.isActive,
      }
      await updateUserApi(params)
      ElMessage.success('更新成功')
    } else {
      const params: CreateUserParams = {
        userName: formData.userName,
        passWord: formData.passWord,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        isActive: formData.isActive,
      }
      await createUserApi(params)
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

// 暴露方法给父组件调用
defineExpose({ openForCreate, openForEdit })
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="520px"
    :close-on-click-modal="false"
    class="user-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px" class="dialog-form">
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="formData.userName" placeholder="请输入用户名" autocomplete="off" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="密码" prop="passWord">
        <el-input v-model="formData.passWord" type="password" show-password placeholder="请输入密码" autocomplete="new-password" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱（选填）" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入手机号（选填）" />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="formData.isActive" active-text="启用" inactive-text="禁用" />
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
.user-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin: 0;
  border-bottom: 1px solid var(--border-color-light);
}

.user-dialog :deep(.el-dialog__title) {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
}

.user-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.user-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  border-top: 1px solid var(--border-color-light);
}

.dialog-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
