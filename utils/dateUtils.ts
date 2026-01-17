
export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${minutes} ${ampm}`;
};

export const formatDurationDisplay = (durationStr: string) => {
  if (!durationStr) return '';
  const [hrs, mins] = durationStr.split(':').map(Number);
  if (!hrs && !mins) return '';
  const hLabel = hrs > 0 ? `${hrs}h` : '';
  const mLabel = mins > 0 ? `${mins}m` : '';
  return `${hLabel} ${mLabel}`.trim();
};
