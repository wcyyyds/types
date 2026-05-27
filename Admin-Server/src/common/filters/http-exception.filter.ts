import { ExceptionFilter, Catch, ArgumentsHost, HttpException} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dto/api-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = '服务器内部错误';

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      if (typeof responseObj.message === 'string') {
        message = responseObj.message;
      } else if (Array.isArray(responseObj.message)) {
        message = responseObj.message[0];
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    const apiResponse = ApiResponseDto.error(status, message);
    response.status(status).json(apiResponse);
  }
}
