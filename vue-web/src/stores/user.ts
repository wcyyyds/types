import { ref } from "vue";
import { defineStore } from "pinia";
import type { UserInfo, LoginParams, } from "@/types";
import { tokenManager, storage } from "@/utils";
import { loginApi, logoutApi, forceLogoutApi } from "@/api/login";

const USER_INFO_KEY = "user_info";

export const useUserStore = defineStore("user", () => {
  const userInfo = ref<UserInfo | null>(null);
  const token = ref<string | null>(tokenManager.get());

  /** 是否已登录 */
  const isLoggedIn = ref(!!token.value);

  /** 登录 */
  async function login(params: LoginParams) {
    // 后端返回扁平结构 LoginResult，包含 accessToken 和用户字段
    const result: UserInfo = await loginApi(params);

    const newToken = result.accessToken;
    const user: UserInfo = {
      id: result.id,
      userName: result.userName,
      email: result.email,
      phone: result.phone,
      isActive: result.isActive,
    };

    token.value = newToken as string;
    userInfo.value = user;
    isLoggedIn.value = true;

    tokenManager.set(newToken as string);
    storage.set(USER_INFO_KEY, user);

    return { token: newToken, user };
  }

  /** 退出登录（先调后端清除服务端数据，再清本地缓存） */
  async function logout() {
    const userId = userInfo.value?.id;

    try {
      if (token.value && userId) {
        // 有 token → 正常登出，后端只清当前 token
        await logoutApi();
      } else if (userId) {
        // token 已丢失但有 userId → 强制登出，后端清所有数据
        await forceLogoutApi({ userId });
      }
      // 既无 token 也无 userId → 只清本地
    } catch {
      // 接口失败不影响本地登出
    }

    // 无论接口成功与否，都清空本地缓存
    token.value = null;
    userInfo.value = null;
    isLoggedIn.value = false;
    tokenManager.remove();
    storage.remove(USER_INFO_KEY);
  }

  /**
   * 强制登出（本地 token 失效时调用，如 401）
   * 只清本地，同时通知后端清理服务端数据
   */
  async function forceLogout() {
    const userId = userInfo.value?.id;

    // 通知后端清理（不等待结果）
    if (userId) {
      forceLogoutApi({ userId }).catch(() => {});
    }

    token.value = null;
    userInfo.value = null;
    isLoggedIn.value = false;
    tokenManager.remove();
    storage.remove(USER_INFO_KEY);
  }

  /** 从本地存储恢复用户信息 */
  function restoreUser() {
    const saved = storage.get<UserInfo>(USER_INFO_KEY);
    if (saved) {
      userInfo.value = saved;
      isLoggedIn.value = true;
    }
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    login,
    logout,
    forceLogout,
    restoreUser,
  };
});
