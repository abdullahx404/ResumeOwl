const monthLabels = [
  "Jan",
  "Feb",
  "March",
  "April",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

export function formatResumeDate(value?: string): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  const monthMatch = trimmed.match(/^(\d{4})-(\d{2})$/);

  if (!monthMatch) {
    return trimmed;
  }

  const monthIndex = Number(monthMatch[2]) - 1;

  if (monthIndex < 0 || monthIndex >= monthLabels.length) {
    return trimmed;
  }

  return `${monthLabels[monthIndex]} ${monthMatch[1]}`;
}

export function formatResumeDateRange(startDate?: string, endDate?: string): string {
  return [formatResumeDate(startDate), formatResumeDate(endDate)].filter(Boolean).join(" - ");
}

export function isValidMonthDateRange(startDate?: string, endDate?: string): boolean {
  const start = startDate?.trim();
  const end = endDate?.trim();

  if (!start || !end) {
    return true;
  }

  if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end)) {
    return true;
  }

  return end >= start;
}
