import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from "@nestjs/common";
import { Response } from "express";

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, message } = exception.getResponse() as {
      status: number;
      message: any;
    };

    // 只返回第一个错误
    const errorMessage = Array.isArray(message)
      ? message[0]
      : typeof message === "string"
        ? message
        : "请求参数错误";

    response.status(status).json({
      code: status,
      message: errorMessage,
    });
  }
}
