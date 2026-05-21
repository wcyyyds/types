<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue'
import type { UserInfo, UserListResult, CreateUserParams, UpdateUserParams } from '@/types'
import { getUserListApi, createUserApi, updateUserApi, deleteUserApi } from '@/api/user'

// ============================================================
// 状态
// ============================================================

const loading = ref(false)
const list = ref<UserInfo[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  userName: '',
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)

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

const formRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度 2-50 个字符', trigger: 'blur' },
  ],
  passWord: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度 6-50 个字符', trigger: 'blur' },
  ],
  email: [{ type: 'email' as const, message: '请输入正确的邮箱地址', trigger: 'blur' }],
}

// ============================================================
// 方法
// ============================================================

async function fetchList() {
  loading.value = true
  try {
    const result: UserListResult = await getUserListApi({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      userName: queryParams.userName || undefined,
    })
    list.value = result.list
    total.value = result.total
  } catch {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.page = 1
  fetchList()
}

function handleReset() {
  queryParams.userName = ''
  queryParams.page = 1
  fetchList()
}

function handlePageChange(page: number) {
  queryParams.page = page
  fetchList()
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  queryParams.page = 1
  fetchList()
}

function openCreateDialog() {
  isEdit.value = false
  dialogTitle.value = '新增用户'
  formData.id = undefined
  formData.userName = ''
  formData.passWord = ''
  formData.email = ''
  formData.phone = ''
  formData.isActive = true
  dialogVisible.value = true
}

function openEditDialog(row: UserInfo) {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  formData.id = row.id
  formData.userName = row.userName
  formData.passWord = ''
  formData.email = row.email || ''
  formData.phone = row.phone || ''
  formData.isActive = row.isActive
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()

  try {
    if (isEdit.value) {
      const params: UpdateUserParams = {
        id: formData.id!,
        userName: formData.userName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
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
    dialogVisible.value = false
    fetchList()
  } catch {
    // 错误已在拦截器中处理
  }
}

async function handleDelete(row: UserInfo) {
  try {
    await ElMessageBox.confirm(`确定要删除用户「${row.userName}」吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUserApi(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // 取消或失败都不处理
  }
}

// ============================================================
// 初始化
// ============================================================

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="user-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-info">
        <h2 class="page-title">人员管理</h2>
        <p class="page-desc">管理系统中的所有用户账号</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        新增用户
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" layout="inline" class="search-form">
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.userName"
            placeholder="请输入用户名搜索"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格卡片 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">用户列表</span>
          <el-tag type="info" effect="plain" size="small">
            共 {{ total }} 条
          </el-tag>
        </div>
      </template>

      <el-table
        :data="list"
        v-loading="loading"
        stripe
        style="width: 100%"
        :header-cell-style="{ background: 'var(--bg-color-muted)', color: 'var(--text-color-secondary)', fontWeight: 600 }"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="userName" label="用户名" min-width="140">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" icon="UserFilled" class="user-avatar" />
              <span>{{ row.userName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="200">
          <template #default="{ row }">
            <span v-if="row.email" class="cell-email">{{ row.email }}</span>
            <span v-else class="cell-empty">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="150">
          <template #default="{ row }">
            <span v-if="row.phone" class="cell-phone">{{ row.phone }}</span>
            <span v-else class="cell-empty">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.isActive ? 'success' : 'danger'"
              effect="light"
              size="small"
              class="status-tag"
            >
              <span class="status-dot" :class="{ active: row.isActive }" />
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              :icon="Edit"
              @click="openEditDialog(row)"
              class="action-btn"
            >
              编辑
            </el-button>
            <el-divider direction="vertical" />
            <el-button
              type="danger"
              link
              size="small"
              :icon="Delete"
              @click="handleDelete(row)"
              class="action-btn danger"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      :close-on-click-modal="false"
      class="user-dialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        class="dialog-form"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="formData.userName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="passWord">
          <el-input
            v-model="formData.passWord"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱（选填）" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="formData.phone" placeholder="请输入手机号（选填）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="formData.isActive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '保存修改' : '确认新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-management {
  max-width: 100%;
  margin: 0 auto;
}

/* ===== 页面标题 ===== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.page-desc {
  font-size: 13px;
  color: var(--text-color-tertiary);
  margin: 4px 0 0 0;
}

/* ===== 搜索栏 ===== */
.search-card {
  margin-bottom: 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-color-container);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

/* ===== 表格卡片 ===== */
.table-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-color-container);
}

.table-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
}

/* 用户头像+名称 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  flex-shrink: 0;
  background: var(--primary-bg);
  color: var(--primary);
}

/* 空值占位 */
.cell-empty {
  color: var(--text-color-tertiary);
}

.cell-email,
.cell-phone {
  color: var(--text-color);
}

/* 状态标签 */
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--danger);
}

.status-dot.active {
  background: var(--success);
}

/* 操作按钮 */
.action-btn {
  font-size: 13px;
}

.action-btn.danger:hover {
  color: var(--danger);
}

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0 4px;
}

/* ===== 弹窗 ===== */
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
