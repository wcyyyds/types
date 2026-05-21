import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DateUtil } from './common/utils/date.util';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
