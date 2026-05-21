import * as dayjs from 'dayjs';

export class DateUtil {
  /**
   * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
   * @param date 日期对象
   * @returns 格式化后的日期字符串
   */
  static formatDateTime(date: Date): string {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * 格式化日期为 YYYY-MM-DD 格式
   * @param date 日期对象
   * @returns 格式化后的日期字符串
   */
  static formatDate(date: Date): string {
    return dayjs(date).format('YYYY-MM-DD');
  }

  /**
   * 格式化时间为 HH:mm:ss 格式
   * @param date 日期对象
   * @returns 格式化后的时间字符串
   */
  static formatTime(date: Date): string {
    return dayjs(date).format('HH:mm:ss');
  }

  /**
   * 获取当前时间的格式化字符串
   * @returns 当前时间的格式化字符串
   */
  static now(): string {
    return this.formatDateTime(new Date());
  }

  /**
   * 获取当前日期的格式化字符串
   * @returns 当前日期的格式化字符串
   */
  static today(): string {
    return this.formatDate(new Date());
  }
}
