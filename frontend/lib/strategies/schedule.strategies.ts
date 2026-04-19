// @frontend/lib/strategies/schedule.strategies.ts

export interface ScheduleStrategy {
  calculateEndTime(startTime: string, durationMinutes: number): string;
}

export class AutomatedScheduleStrategy implements ScheduleStrategy {
  calculateEndTime(startTime: string, durationMinutes: number): string {
    if (!startTime || !durationMinutes) return "";

    // startTime 通常是 "2026-04-20T18:45" (来自 datetime-local input)
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return "";

    // 计算结束时间
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    
    // 手动拼接，不使用 toISOString()，这样可以保持“所见即所得”
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
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