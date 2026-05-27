import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * v-permission 权限指令
 * 用法: <button v-permission="'user:delete'">删除</button>
 *       <button v-permission="['user:delete', 'user:add']">操作</button>
 *
 * 当用户没有对应权限时，按钮从 DOM 中移除
 */
const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const userStore = useUserStore()
    const perms = userStore.userInfo?.perms || []

    const requiredPerms: string | string[] = binding.value
    const hasPermission = Array.isArray(requiredPerms)
      ? requiredPerms.some((p) => perms.includes(p))
      : perms.includes(requiredPerms)

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  },
}

export default permission
