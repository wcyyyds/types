<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import AppPagination, { type PageEmitPropsTypes } from '@/components/AppPagination.vue'
import RoleFormDialog from './RoleFormDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, Download } from '@element-plus/icons-vue'
import type { RoleInfo, RoleListParams } from '@/types'
import { getRoleListApi, deleteRoleApi, exportRoleApi } from '@/api/role'

onMounted(() => {
  fetchList()
})

const loading = ref(false)
const list = ref<RoleInfo[]>([])
const total = ref(0)

const queryParams: RoleListParams | any = reactive({
  page: 1,
  pageSize: 20,
  roleName: '',
  roleCode: '',
  isActive: undefined as boolean | undefined,
  createTimeStart: '',
  createTimeEnd: '',
})

async function fetchList() {
  loading.value = true
  list.value = []
  try {
    const res = await getRoleListApi(queryParams)
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
  queryParams.roleName = ''
  queryParams.roleCode = ''
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

const dialogRef = ref<InstanceType<typeof RoleFormDialog>>()
const dialogVisible = ref(false)

function openCreateDialog() {
  dialogRef.value?.openForCreate()
  dialogVisible.value = true
}

function openEditDialog(row: RoleInfo) {
  dialogRef.value?.openForEdit(row)
  dialogVisible.value = true
}

function handleDialogSuccess() {
  fetchList()
}

async function handleExport() {
  const blob = await exportRoleApi(queryParams)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `角色列表_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleDelete(row: RoleInfo) {
  try {
    await ElMessageBox.confirm(`确定要删除角色「${row.roleName}」吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteRoleApi(row.id as number)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
  }
}
</script>

<template>
  <div class="management-list">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="queryParams" layout="inline" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="queryParams.isActive" placeholder="全部" clearable style="width: 100px"
            @change="handleSearch">
            <el-option :value="true" label="正常" />
            <el-option :value="false" label="停用" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="queryParams.roleName" placeholder="请输入角色名称" clearable style="width: 180px"
            @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input v-model="queryParams.roleCode" placeholder="请输入角色编码" clearable style="width: 180px"
            @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker v-model="queryParams.createTimeStart" type="datetime" placeholder="开始日期"
            value-format="YYYY-MM-DD HH:mm:ss" style="width: 180px" @change="handleSearch" />
          <span style="margin: 0 6px; color: var(--text-color-tertiary);">至</span>
          <el-date-picker v-model="queryParams.createTimeEnd" type="datetime" placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss" style="width: 180px" @change="handleSearch" />
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
          <span class="table-title">角色列表</span>
          <div class="table-actions">
            <el-button :icon="Download" @click="handleExport">导出</el-button>
            <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增角色</el-button>
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
        <el-table-column prop="roleName" label="角色名称" min-width="160"fixed="left"/>
        <el-table-column prop="roleCode" label="角色编码" width="160" />
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column prop="isActive" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" effect="light" size="small">
              {{ row.isActive ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200">
          <template #default="{ row }">
            <span>{{ row.remark || '—' }}</span>
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
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button type="danger" link size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <AppPagination :total="total" :page="queryParams.page" :page-size="queryParams.pageSize"
        @change="handlePaginationChange" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <RoleFormDialog ref="dialogRef" v-model="dialogVisible" @success="handleDialogSuccess" />
  </div>
</template>

<style scoped>
.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
