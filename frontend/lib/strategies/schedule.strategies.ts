// @frontend/lib/strategies/schedule.strategies.ts

export interface ScheduleStrategy {
  calculateEndTime(startTime: string, durationMinutes: number): string;
}

export class AutomatedScheduleStrategy implements ScheduleStrategy {
  calculateEndTime(startTime: string, durationMinutes: number): string {
    if (!startTime || !durationMinutes) return "";

    // came from datetime-local input
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return "";

    // Calculate end time
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    
    
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
    return "";
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