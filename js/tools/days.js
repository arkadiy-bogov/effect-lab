function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateInput(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(from, to, includeEnd) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  const diff = Math.round((b - a) / 86400000);
  if (!includeEnd) return diff;
  return diff >= 0 ? diff + 1 : diff - 1;
}

function businessDaysBetween(from, to, includeEnd) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  const step = start <= end ? 1 : -1;
  let cur = new Date(start);
  let count = 0;
  const last = includeEnd ? end : new Date(end.getTime() - step * 86400000);

  if (!includeEnd && start.getTime() === end.getTime()) return 0;

  while (step > 0 ? cur <= last : cur >= last) {
    const wd = cur.getDay();
    if (wd !== 0 && wd !== 6) count += step;
    cur.setDate(cur.getDate() + step);
  }
  return count;
}

function addPeriod(date, { years = 0, months = 0, weeks = 0, days = 0 }) {
  const d = startOfDay(date);
  if (years) d.setFullYear(d.getFullYear() + years);
  if (months) d.setMonth(d.getMonth() + months);
  if (weeks) d.setDate(d.getDate() + weeks * 7);
  if (days) d.setDate(d.getDate() + days);
  return d;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((startOfDay(date) - start) / 86400000);
}

function isoWeek(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
}

export function analyzeDateRange({ from, to, includeEnd = true }) {
  const start = parseDateInput(from);
  const end = parseDateInput(to);
  if (!start || !end) return null;

  const totalDays = daysBetween(start, end, includeEnd);
  const absDays = Math.abs(totalDays);
  const business = businessDaysBetween(start, end, includeEnd);

  const monthsApprox = absDays / 30.4375;
  const yearsApprox = absDays / 365.25;

  return {
    from: formatDate(start),
    to: formatDate(end),
    totalDays,
    absDays,
    businessDays: business,
    weeks: absDays / 7,
    monthsApprox,
    yearsApprox,
    fromDayOfYear: dayOfYear(start),
    toDayOfYear: dayOfYear(end),
    fromWeek: isoWeek(start),
    toWeek: isoWeek(end),
  };
}

export function shiftDate({ date, years = 0, months = 0, weeks = 0, days = 0, direction = 1 }) {
  const start = parseDateInput(date);
  if (!start) return null;
  const dir = direction < 0 ? -1 : 1;
  const result = addPeriod(start, {
    years: years * dir,
    months: months * dir,
    weeks: weeks * dir,
    days: days * dir,
  });
  return {
    from: formatDate(start),
    result: formatDate(result),
    dayOfYear: dayOfYear(result),
    week: isoWeek(result),
  };
}

export function todayInputValue() {
  return formatDate(startOfDay(new Date()));
}
