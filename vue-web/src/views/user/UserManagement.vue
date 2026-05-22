<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import AppPagination, { type PageEmitPropsTypes } from '@/components/AppPagination.vue'
import UserFormDialog from './UserFormDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, Download } from '@element-plus/icons-vue'
import type { UserInfo, UserListParams } from '@/types'
import { getUserListApi, deleteUserApi, exportUserApi } from '@/api/user'

onMounted(() => {
  fetchList()
})

const loading = ref(false)
const list = ref<UserInfo[]>([])
const total = ref(0)

const queryParams: UserListParams | any = reactive({
  page: 1,
  pageSize: 20,
  userName: '',
  isActive: undefined as boolean | undefined,
  createTimeStart: '',
  createTimeEnd: '',
})

async function fetchList() {
  loading.value = true
  list.value = []
  try {
    const res = await getUserListApi(queryParams)
    list.value = res.data || []
    total.value = res.total ?? 0
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
  queryParams.isActive = undefined
  queryParams.createTimeStart = ''
  queryParams.createTimeEnd = ''
  queryParams.page = 1
  fetchList()
}

function handlePaginationChange({ page, pageSize }: PageEmitPropsTypes) {
  queryParams.page = page
  queryParams.pageSize = pageSize
  fetchList()
}


function handleDialogSuccess() {
  fetchList()
}

async function handleDelete(row: UserInfo) {
  try {
    await ElMessageBox.confirm(`确定要删除用户「${row.userName}」吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUserApi(row.id as number)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
  }
}

const dialogRef = ref<InstanceType<typeof UserFormDialog>>()
const dialogVisible = ref(false)

function openCreateDialog() {
  dialogRef.value?.openForCreate()
  dialogVisible.value = true
}

function openEditDialog(row: UserInfo) {
  dialogRef.value?.openForEdit(row)
  dialogVisible.value = true
}

async function handleExport() {
  const blob = await exportUserApi(queryParams)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `用户列表_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="management-list">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="queryParams" layout="inline" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="queryParams.isActive" placeholder="全部" clearable style="width: 120px"
            @change="handleSearch">
            <el-option :value="true" label="启用" />
            <el-option :value="false" label="禁用" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="queryParams.userName" placeholder="请输入用户名搜索" clearable style="width: 220px"
            @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="queryParams.createTimeStart"
            type="datetime"
            placeholder="开始日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 180px"
            @change="handleSearch"
          />
          <span style="margin: 0 6px; color: var(--text-color-tertiary);">至</span>
          <el-date-picker
            v-model="queryParams.createTimeEnd"
            type="datetime"
            placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 180px"
            @change="handleSearch"
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
          <div class="table-actions">
            <el-button :icon="Download" @click="handleExport">导出</el-button>
            <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增用户</el-button>
          </div>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" stripe style="width: 100%" height="100%"
        :header-cell-style="{ background: 'var(--bg-color-muted)', color: 'var(--text-color-secondary)', fontWeight: 600 }">
        <el-table-column label="编号" width="70" align="center" fixed="left">
          <template #default="{ $index }">
            {{ (queryParams.page - 1) * queryParams.pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户名" min-width="140" fixed="left">
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
            <el-tag :type="row.isActive ? 'success' : 'danger'" effect="light" size="small" class="status-tag">
              <span class="status-dot" :class="{ active: row.isActive }" />
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createUserName" label="创建人" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.createUserName || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column prop="lastModifierName" label="最后修改人" width="120" align="center">
          <template #default="{ row }">
            <span>{{ row.lastModifierName || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastModified" label="最后修改时间" width="170" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" :icon="Edit" @click="openEditDialog(row)" class="action-btn">
              编辑
            </el-button>
            <el-divider direction="vertical" />
            <el-button type="danger" link size="small" :icon="Delete" @click="handleDelete(row)"
              class="action-btn danger">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <AppPagination :total="total" :page="queryParams.page" :page-size="queryParams.pageSize"
        @change="handlePaginationChange" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <UserFormDialog ref="dialogRef" v-model="dialogVisible" @success="handleDialogSuccess" />
  </div>
</template>

<style scoped>
/* 表格头部操作按钮 */
.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
</style>
