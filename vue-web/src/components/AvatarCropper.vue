<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { uploadAvatarApi } from '@/api/user'
import { useUserStore } from '@/stores/user'

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
  success: [url: string]
}>()

const userStore = useUserStore()

// ===== 状态 =====
const imageUrl = ref('')
const cropper = ref<Cropper | null>(null)
const uploading = ref(false)
const imgRef = ref<HTMLImageElement>()
const previewUrl = ref('')

/** 打开文件选择器 */
const fileInputRef = ref<HTMLInputElement>()
function triggerSelect() {
  fileInputRef.value?.click()
}

/** 选择文件后加载到裁剪器 */
function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证格式
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('仅支持 jpg/png/gif/webp 格式')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target?.result as string
    nextTick(() => initCropper())
  }
  reader.readAsDataURL(file)

  // 重置 input
  input.value = ''
}

/** 初始化裁剪器 */
function initCropper() {
  cropper.value?.destroy()
  if (imgRef.value) {
    cropper.value = new Cropper(imgRef.value, {
      viewMode: 0,
      dragMode: 'crop',
      cropBoxResizable: true,
      cropBoxMovable: true,
      guides: true,
      center: true,
      background: false,
      autoCropArea: 1,
      movable: true,
      scalable: true,
      zoomable: true,
      toggleDragModeOnDblclick: false,
    })
  }
}

/** 获取裁剪后的 Blob */
function getCroppedBlob(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!cropper.value) {
      reject(new Error('裁剪器未初始化'))
      return
    }
    const canvas = cropper.value.getCroppedCanvas({
      imageSmoothingQuality: 'high',
    })
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('裁剪失败'))
    }, 'image/jpeg', 0.9)
  })
}

/** 预览裁剪结果 */
async function preview() {
  try {
    const blob = await getCroppedBlob()
    previewUrl.value = URL.createObjectURL(blob)
  } catch {
    ElMessage.error('预览失败')
  }
}

/** 确认上传 */
async function handleUpload() {
  if (!cropper.value) {
    ElMessage.warning('请先选择图片')
    return
  }

  uploading.value = true
  try {
    const blob = await getCroppedBlob()
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    await uploadAvatarApi(file)
    await userStore.fetchUserProfile()
    ElMessage.success('头像上传成功')
    emit('success', '')
    handleClose()
  } catch {
    // 错误已在拦截器中处理
  } finally {
    uploading.value = false
  }
}

function handleClose() {
  cropper.value?.destroy()
  cropper.value = null
  imageUrl.value = ''
  previewUrl.value = ''
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="上传头像"
    width="640px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="handleClose"
  >
    <div class="avatar-upload">
      <!-- 选择图片按钮 -->
      <div class="upload-actions" v-if="!imageUrl">
        <el-button type="primary" @click="triggerSelect">
          选择图片
        </el-button>
        <p class="upload-hint">支持 jpg/png/gif/webp 格式，最大 2MB</p>
      </div>

      <!-- 裁剪区域 -->
      <div v-if="imageUrl" class="crop-area">
        <div class="crop-container">
          <img ref="imgRef" :src="imageUrl" class="crop-image" />
        </div>
      </div>

      <!-- 预览区域 -->
      <div v-if="previewUrl" class="preview-area">
        <p class="preview-label">预览</p>
        <div class="preview-circle">
          <img :src="previewUrl" class="preview-image" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="imageUrl" class="crop-actions">
        <el-button @click="triggerSelect">重新选择</el-button>
        <el-button @click="preview">预览</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">
          {{ uploading ? '上传中...' : '确认上传' }}
        </el-button>
      </div>
    </div>

    <!-- 隐藏的文件选择器 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      style="display: none"
      @change="onFileSelected"
    />
  </el-dialog>
</template>

<style scoped>
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-height: 300px;
}

.upload-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-color-tertiary);
  margin: 0;
}

.crop-area {
  width: 100%;
  display: flex;
  justify-content: center;
}

.crop-container {
  width: 400px;
  height: 400px;
  background: #f0f0f0;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.crop-image {
  max-width: 100%;
  display: block;
}

.preview-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-label {
  font-size: 13px;
  color: var(--text-color-secondary);
  margin: 0;
  font-weight: 500;
}

.preview-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.crop-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
