import axios, { AxiosError } from "axios";
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, ForceLogoutParams } from "@/types";
import { tokenManager, storage } from "@/utils";
import { ElMessage, ElMessageBox } from "element-plus";

// ============================================================
// 请求配置
// ============================================================

const DEFAULT_CONFIG: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
};

// ============================================================
// 创建实例
// ============================================================

const http: AxiosInstance = axios.create(DEFAULT_CONFIG);

// ============================================================
// 请求拦截器
// ============================================================

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ============================================================
// 响应拦截器
// ============================================================

/** 业务错误码 — 后端约定 code === 0 为成功 */
const SUCCESS_CODE = 0;

/** 是否正在执行 401 清理（避免重复触发） */
let isHandling401 = false;

http.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse;

    // 业务失败
    if (body.code !== SUCCESS_CODE) {
      const msg = body.message || "请求失败";
      ElMessage.error(msg);
      return Promise.reject(new Error(msg));
    }

    // 成功 — 直接返回 data 负载，调用方拿到 T
    return body.data as any;
  },
  (error: AxiosError<ApiResponse>) => {
    // HTTP 层面错误（网络断开、超时、非 2xx）
    if (!error.response) {
      ElMessage.error("网络连接异常，请检查网络");
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // 401 → token 失效（被踢/过期），弹确认框，用户确认后才清理并跳登录
    if (status === 401 && !isHandling401) {
      isHandling401 = true;

      ElMessageBox.confirm(
        data?.message || "登录已失效，请重新登录",
        "提示",
        {
          confirmButtonText: "确定",
          showCancelButton: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          showClose: false,
          type: "warning",
        },
      ).then(() => {
        const userInfo = storage.get<{ id?: number }>("user_info");
        const userId = userInfo?.id;

        // 通知后端清理该用户的服务端数据（不等待）
        if (userId) {
          axios.post("/auth/logout/force", { userId } as ForceLogoutParams).catch(() => {});
        }

        // 清空本地缓存
        tokenManager.remove();
        storage.remove("user_info");

        // 跳转登录页
        window.location.href = "/login";
      });

      return Promise.reject(error);
    }

    switch (status) {
      case 403:
        ElMessage.error("没有权限执行此操作");
        break;
      case 404:
        ElMessage.error("请求的资源不存在");
        break;
      case 500:
        ElMessage.error("服务器内部错误");
        break;
      default:
        ElMessage.error(data?.message || `请求失败 (${status})`);
    }

    return Promise.reject(error);
  },
);

// ============================================================
// 导出
// ============================================================

export default http;
