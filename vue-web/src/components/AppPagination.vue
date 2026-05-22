<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface PageEmitPropsTypes {
  page: number
  pageSize: number
}

const props = withDefaults(defineProps<{
  total: number
  page?: number
  pageSize?: number
}>(), {
  page: 1,
  pageSize: 20,
})

const emit = defineEmits<{
  change: [params: { page: number; pageSize: number }]
}>()

// ============================================================
// 状态
// ============================================================

const pageSizeOptions = [20, 50, 100, 200, 500, -1]

const currentPage = ref(props.page)
const currentSize = ref(props.pageSize)
const jumpPage = ref(1)

const maxPage = computed(() => Math.ceil(props.total / currentSize.value) || 1)

// ============================================================
// 方法
// ============================================================

function emitChange() {
  emit('change', { page: currentPage.value, pageSize: currentSize.value })
}

function handlePageChange(page: number) {
  currentPage.value = page
  emitChange()
}

function handleSizeChange(size: number) {
  currentSize.value = size === -1 ? 1000000 : size
  currentPage.value = 1
  emitChange()
}

function handleJump() {
  const p = Math.max(1, Math.min(jumpPage.value, maxPage.value))
  if (p !== currentPage.value) {
    currentPage.value = p
    emitChange()
  }
}

// 同步外部 prop 变化
watch(() => props.page, (val) => { currentPage.value = val })
watch(() => props.pageSize, (val) => { currentSize.value = val })
</script>

<template>
  <div class="pagination-wrap" v-if="total > 0">
    <div class="pagination-left">
      <el-select v-model="currentSize" size="small" style="width: 110px" @change="handleSizeChange">
        <el-option v-for="s in pageSizeOptions" :key="s" :value="s" :label="s === -1 ? '不分页' : `${s} 条/页`" />
      </el-select>
    </div>
    <el-pagination v-model:current-page="currentPage" v-model:page-size="currentSize" :total="total" :pager-count="9"
      layout="prev, pager, next" background @current-change="handlePageChange" />
    <div class="pagination-right">
      <span class="pagination-info">第 {{ currentPage }} / {{ maxPage }} 页，</span>
      <span class="pagination-total">共 {{ total }} 条</span>
      <span class="pagination-jumper">
        跳至 <el-input v-model.number="jumpPage" size="small" type="number" :min="1" :max="maxPage" style="width: 56px"
          @keyup.enter="handleJump" /> 页
      </span>
    </div>
  </div>
</template>

<style scoped>
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 0 4px;
  gap: 12px;
}

.pagination-left {
  flex-shrink: 0;
}

.pagination-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
}

.pagination-info,
.pagination-total,
.pagination-jumper {
  font-size: 13px;
  color: var(--text-color-tertiary);
  white-space: nowrap;
}

.pagination-jumper {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.pagination-jumper :deep(.el-input__inner) {
  text-align: center;
}

/* 隐藏 number 输入框的上下箭头 */
.pagination-jumper :deep(input::-webkit-outer-spin-button),
.pagination-jumper :deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
</style>
