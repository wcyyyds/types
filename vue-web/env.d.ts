/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 接口基础地址 */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
