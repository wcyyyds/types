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

/** 业务错误码 — 后端约定 code === 0 为成功 */
const SUCCESS_CODE = 0;

/** 是否正在执行 401 清理（避免重复触发） */
let isHandling401 = false;

// ============================================================
// 公共拦截器工厂
// ============================================================

/** 请求拦截器 — 注入 token */
function createRequestInterceptor() {
  return (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };
}

/** 401 处理 — 弹确认框 → 通知后端 → 清缓存 → 跳登录 */
function handle401(data?: ApiResponse) {
  if (isHandling401) return;
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

    if (userId) {
      axios.post("/auth/logout/force", { userId } as ForceLogoutParams).catch(() => {});
    }

    tokenManager.remove();
    storage.remove("user_info");
    window.location.href = "/login";
  });
}

/** HTTP 层面错误处理（非 401） */
function handleHttpError(status: number, data?: ApiResponse) {
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
}

/** 响应错误拦截器（http / httpWithBody 共用） */
function createResponseErrorInterceptor() {
  return (error: AxiosError<ApiResponse>) => {
    if (!error.response) {
      ElMessage.error("网络连接异常，请检查网络");
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    if (status === 401) {
      handle401(data);
      return Promise.reject(error);
    }

    handleHttpError(status, data);
    return Promise.reject(error);
  };
}

/**
 * 创建 axios 实例（共享配置、请求拦截器、错误拦截器）
 * @param useRawBody 为 true 时成功返回完整 ApiResponse body，否则仅返回 data
 */
function createInstance(useRawBody: boolean): AxiosInstance {
  const instance: AxiosInstance = axios.create(DEFAULT_CONFIG);

  // 请求拦截器
  instance.interceptors.request.use(
    createRequestInterceptor(),
    (error: AxiosError) => Promise.reject(error),
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      const body = response.data as ApiResponse;

      if (body.code !== SUCCESS_CODE) {
        const msg = body.message || "请求失败";
        ElMessage.error(msg);
        return Promise.reject(new Error(msg));
      }

      return useRawBody ? (body as any) : (body.data as any);
    },
    createResponseErrorInterceptor(),
  );

  return instance;
}

// ============================================================
// 实例
// ============================================================

/** 默认实例 — 成功时仅返回 data 负载 */
const http = createInstance(false);

/** 完整 body 实例 — 成功时返回完整 ApiResponse（含 page / total 等） */
export const httpWithBody = createInstance(true);

// ============================================================
// 导出
// ============================================================

export default http;
