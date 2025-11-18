import {
    format,
    isToday,
    isYesterday,
    isTomorrow,
    parseISO,
    differenceInMinutes,
    differenceInHours,
    isThisWeek,
    isThisYear,
  } from 'date-fns';
  import { enGB } from 'date-fns/locale';
  
  export const parsedDate = (inputDate) => {
    if (!inputDate) return '';
  
    const date = typeof inputDate === 'string' ? parseISO(inputDate) : inputDate;
    const now = new Date();
  
    if (isToday(date)) {
      const minutes = differenceInMinutes(now, date);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
      const hours = differenceInHours(now, date);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
  
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'p', { locale: enGB })}`;
    }
  
    if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'p', { locale: enGB })}`;
    }
  
    if (isThisWeek(date)) {
      return format(date, 'EEEE p', { locale: enGB }); // e.g., "Monday 3:30 PM"
    }
  
    if (isThisYear(date)) {
      return format(date, 'dd MMM yyyy, p', { locale: enGB }); // e.g., "25 Jul 2025, 4:15 PM"
    }
  
    return format(date, 'PPpp', { locale: enGB }); // fallback: Jul 25, 2024 at 4:20 PM
  }

export const formatDateOnly = (inputDate) => {
  if (!inputDate) return '';
  
    const date = typeof inputDate === 'string' ? parseISO(inputDate) : inputDate;
  
    if (isToday(date)) {
      return 'Today';
    }
  
    if (isYesterday(date)) {
      return 'Yesterday';
    }
  
    if (isTomorrow(date)) {
      return 'Tomorrow';
    }
  
    if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: enGB }); // e.g., "Monday"
    }
  
    if (isThisYear(date)) {
      return format(date, 'dd MMM yyyy', { locale: enGB }); // e.g., "25 Jul 2025"
    }
  
    return format(date, 'PP', { locale: enGB }); // fallback: Jul 25, 2024
  }
  

  const rawClinicMode =
    (typeof import.meta !== 'undefined' && import.meta.env &&
      (import.meta.env.NUXT_PUBLIC_CLINIC_TIME_MODE || import.meta.env.CLINIC_TIME_MODE)) ||
    (typeof process !== 'undefined' && process.env &&
      (process.env.NUXT_PUBLIC_CLINIC_TIME_MODE || process.env.CLINIC_TIME_MODE)) ||
    'agnostic';
  const CLINIC_TIME_MODE = String(rawClinicMode || 'agnostic').toLowerCase();
  const CLINIC_TIME_AGNOSTIC = CLINIC_TIME_MODE === 'agnostic';
  const pad2 = (n) => String(n).padStart(2, '0');
  const isPlainTimeString = (value) => typeof value === 'string' && /^\d{1,2}:\d{2}(?::\d{2})?$/.test(value.trim());
  const isPlainDateString = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  
  const ensureDate = (value) => {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      const str = value.trim();
      if (!str) return null;
      return new Date(str);
    }
    return null;
  };
  
  const getTimeParts = (value) => {
    if (!value && value !== 0) return null;
    if (isPlainTimeString(value)) {
      const [hours, minutes, seconds = '0'] = value.split(':');
      const h = Number(hours);
      const m = Number(minutes);
      const s = Number(seconds);
      if ([h, m, s].some((n) => Number.isNaN(n))) return null;
      return { hours: h, minutes: m, seconds: s };
    }
    const date = ensureDate(value);
    if (!date || Number.isNaN(date.valueOf())) return null;
    const hours = CLINIC_TIME_AGNOSTIC ? date.getUTCHours() : date.getHours();
    const minutes = CLINIC_TIME_AGNOSTIC ? date.getUTCMinutes() : date.getMinutes();
    const seconds = CLINIC_TIME_AGNOSTIC ? date.getUTCSeconds() : date.getSeconds();
    return { hours, minutes, seconds };
  };
  
  const getDateParts = (value) => {
    if (!value && value !== 0) return null;
    if (isPlainDateString(value)) {
      const [year, month, day] = value.split('-').map(Number);
      if ([year, month, day].some((n) => Number.isNaN(n))) return null;
      return { year, month, day };
    }
    const date = ensureDate(value);
    if (!date || Number.isNaN(date.valueOf())) return null;
    const year = CLINIC_TIME_AGNOSTIC ? date.getUTCFullYear() : date.getFullYear();
    const month = (CLINIC_TIME_AGNOSTIC ? date.getUTCMonth() : date.getMonth()) + 1;
    const day = CLINIC_TIME_AGNOSTIC ? date.getUTCDate() : date.getDate();
    return { year, month, day };
  };
  
  export const clinicTimeMode = CLINIC_TIME_MODE;
  
  export const clinicTimeToHM = (value) => {
    const parts = getTimeParts(value);
    if (!parts) return '';
    return `${pad2(parts.hours)}:${pad2(parts.minutes)}`;
  };
  
  export const clinicMinutesFromTime = (value) => {
    const parts = getTimeParts(value);
    if (!parts) return null;
    return parts.hours * 60 + parts.minutes + Math.floor(parts.seconds / 60);
  };
  
  export const clinicDateToYMD = (value) => {
    const parts = getDateParts(value);
    if (!parts) return '';
    return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
  };
  
  export const clinicBuildDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    if (!CLINIC_TIME_AGNOSTIC) {
      const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      return new Date(`${dateStr}T${t}`);
    }
    if (!isPlainDateString(dateStr) || !isPlainTimeString(timeStr)) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes, seconds = '0'] = timeStr.split(':').map(Number);
    if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) return null;
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, Number(seconds) || 0, 0));
  };
  
