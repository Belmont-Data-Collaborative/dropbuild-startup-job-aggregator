export function weekKeyToLabel(weekKey: string): string {
  const parts = weekKey.split('-W');
  if (parts.length !== 2) return weekKey;
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Convert Sunday (0) to 7
  // Monday of week 1
  const monday1 = new Date(jan4);
  monday1.setDate(jan4.getDate() - (dayOfWeek - 1));
  // Monday of target week
  const targetMonday = new Date(monday1);
  targetMonday.setDate(monday1.getDate() + (week - 1) * 7);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const m = months[targetMonday.getMonth()];
  const d = targetMonday.getDate();
  const y = targetMonday.getFullYear();
  return `Week of ${m} ${d}, ${y}`;
}

export function currentWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();

  // Calculate ISO week number
  const jan1 = new Date(year, 0, 1);
  const dayOfYear =
    Math.floor(
      (now.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1;
  const jan1Day = jan1.getDay() || 7; // Monday=1 ... Sunday=7
  const weekNumber = Math.ceil((dayOfYear + (jan1Day - 1)) / 7);

  // Handle edge cases where the week might belong to the previous or next year
  const paddedWeek = String(weekNumber).padStart(2, '0');
  return `${year}-W${paddedWeek}`;
}
