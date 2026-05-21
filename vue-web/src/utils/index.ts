/** 通用工具函数 */

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
