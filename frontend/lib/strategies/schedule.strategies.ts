// @frontend/lib/strategies/schedule.strategies.ts

export interface ScheduleStrategy {
  calculateEndTime(startTime: string, durationMinutes: number): string;
}

export class AutomatedScheduleStrategy implements ScheduleStrategy {
  calculateEndTime(startTime: string, durationMinutes: number): string {
    if (!startTime || !durationMinutes) return "";
    const start = new Date(startTime);
    // 加上持续分钟数 (毫秒计算)
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    
    // 格式化为 HTML input 认识的 'YYYY-MM-DDTHH:mm'
    const tzOffset = end.getTimezoneOffset() * 60000;
    return new Date(end.getTime() - tzOffset).toISOString().slice(0, 16);
  }
}

export class SimpleScheduleStrategy implements ScheduleStrategy {
  calculateEndTime(): string {
    return ""; // 手动模式，不自动填充
  }
}

export class ScheduleStrategyFactory {
  static make(mode: string): ScheduleStrategy {
    if (mode === 'automated') {
      return new AutomatedScheduleStrategy();
    }
    return new SimpleScheduleStrategy();
  }
}