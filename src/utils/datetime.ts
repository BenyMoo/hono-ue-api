/**
 * 日期时间工具函数 - 使用北京时区 (UTC+8)
 */

/**
 * 获取北京时间的当前日期时间
 */
export function getBeijingTime(): Date {
    const now = new Date();
    // 获取 UTC 时间戳
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    // 转换为北京时间 (UTC+8)
    const beijingTime = new Date(utcTime + (8 * 60 * 60 * 1000));
    return beijingTime;
}

/**
 * 获取北京时间的今日日期字符串 (YYYY-MM-DD)
 */
export function getBeijingToday(): string {
    const beijingTime = getBeijingTime();
    return formatDateToYYYYMMDD(beijingTime);
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间为 ISO 字符串（北京时区）
 */
export function formatBeijingTimeToISO(date: Date = getBeijingTime()): string {
    return date.toISOString();
}

/**
 * 将日期字符串转换为北京时间的 Date 对象
 */
export function parseBeijingDate(dateStr: string): Date {
    // 假设输入的日期字符串是北京时区的日期
    const date = new Date(dateStr);
    return date;
}

/**
 * 获取北京时间的当前时间戳（毫秒）
 */
export function getBeijingTimestamp(): number {
    return getBeijingTime().getTime();
}

/**
 * 检查两个日期是否是同一天（北京时区）
 */
export function isSameBeijingDay(date1: Date, date2: Date): boolean {
    return formatDateToYYYYMMDD(date1) === formatDateToYYYYMMDD(date2);
}

/**
 * 获取北京时间的日期对象（只包含日期，不包含时间）
 */
export function getBeijingDateOnly(dateStr?: string): Date {
    const beijingTime = dateStr ? parseBeijingDate(dateStr) : getBeijingTime();
    const dateOnly = new Date(formatDateToYYYYMMDD(beijingTime));
    return dateOnly;
}

/**
 * 添加天数到日期（北京时区）
 */
export function addDaysToBeijingDate(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * 格式化为可读的北京时间字符串
 */
export function formatBeijingTimeReadable(date: Date = getBeijingTime()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 日志输出当前北京时间
 */
export function logBeijingTime(prefix: string = ''): void {
    const timeStr = formatBeijingTimeReadable();
    console.log(`${prefix}北京时间: ${timeStr}`);
}
