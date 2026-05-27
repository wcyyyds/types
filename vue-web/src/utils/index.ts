/** 通用工具函数 */

/**
 * 拼接头像完整路径
 * 后端返回的 avatar 是相对路径 /uploads/avatars/xxx.jpg
 * 需要拼接后端主机地址
 */
export function getAvatarUrl(avatar?: string): string | undefined {
  if (!avatar) return undefined
  const host = import.meta.env.VITE_API_HOST || ''
  return `${host}${avatar}`
}

/**
 * 通用导出函数 — 调用后端导出接口并下载 Excel 文件
 * @param path  API 路径，如 '/user/export'
 * @param name  下载文件名前缀，如 '用户列表'
 * @param body  可选的 POST body 参数
 */
export async function downloadExport(path: string, name: string, body?: any): Promise<void> {
  const token = tokenManager.get()
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error('导出失败')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 本地存储封装
 */
export const storage = {
  get<T = string>(key: string): T | null {
    const value = localStorage.getItem(key)
    if (value === null) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return value as T
    }
  },

  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value))
  },

  remove(key: string): void {
    localStorage.removeItem(key)
  },

  clear(): void {
    localStorage.clear()
  },
}

/** Token 管理 */
const TOKEN_KEY = 'admin_token'

export const tokenManager = {
  get(): string | null {
    return storage.get<string>(TOKEN_KEY)
  },

  set(token: string): void {
    storage.set(TOKEN_KEY, token)
  },

  remove(): void {
    storage.remove(TOKEN_KEY)
  },

  has(): boolean {
    return !!this.get()
  },
}
