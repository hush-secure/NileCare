const DAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const WEEK_DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

function pad(number: number): string {
  if (number < 10) {
    return "0" + number;
  }
  return String(number);
}

export function toDateString(date: Date): string {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

export function getToday(): string {
  return toDateString(new Date());
}

export function getNowTime(): string {
  const now = new Date();
  return pad(now.getHours()) + ":" + pad(now.getMinutes());
}

function parseDate(dateString: string): Date {
  const parts = dateString.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function getDayCode(dateString: string): string {
  return DAY_CODES[parseDate(dateString).getDay()];
}

export function doctorWorksOn(doctorDays: string, dateString: string): boolean {
  const days = doctorDays.split(",");
  const code = getDayCode(dateString);
  for (let i = 0; i < days.length; i++) {
    if (days[i].trim() === code) {
      return true;
    }
  }
  return false;
}

export function formatDay(dateString: string): string {
  const date = parseDate(dateString);
  return DAY_CODES[date.getDay()] + " " + date.getDate() + " " + MONTH_NAMES[date.getMonth()];
}

export function getNextDays(count: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(toDateString(date));
  }
  return days;
}
