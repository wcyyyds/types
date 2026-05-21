import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // 全局异常处理
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS 配置
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 设置全局前缀
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();
