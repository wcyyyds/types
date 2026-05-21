export class ApiResponseDto<T = any> {
  code: number;
  message?: string;
  data?: T;
  page?: number;
  pageSize?: number;
  total?: number;

  constructor(code: number, message?: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static success<T>(data?: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(0, message || '操作成功', data);
  }

  static successWithPage<T>(
    data: T,
    page: number,
    pageSize: number,
    total: number,
    message?: string,
  ): ApiResponseDto<T> {
    const res = new ApiResponseDto(0, message || '操作成功', data);
    res.page = page;
    res.pageSize = pageSize;
    res.total = total;
    return res;
  }

  static error(code: number, message: string): ApiResponseDto {
    return new ApiResponseDto(code, message);
  }
}
