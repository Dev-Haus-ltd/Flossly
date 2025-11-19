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
    parse,
    isMatch,
    isValid,
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
  

  const pad2 = (n) => String(n).padStart(2, '0');
  const TIME_FORMATS = ['HH:mm:ss', 'HH:mm', 'H:mm:ss', 'H:mm'];
  const DATE_FORMAT = 'yyyy-MM-dd';
  const createZeroReference = () => {
    const ref = new Date(0);
    ref.setUTCHours(0, 0, 0, 0);
    return ref;
  };
  
  const coerceDate = (value) => {
    if (value instanceof Date) return isValid(value) ? value : null;
    if (typeof value === 'number') {
      const date = new Date(value);
      return isValid(date) ? date : null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = new Date(trimmed);
      return isValid(parsed) ? parsed : null;
    }
    return null;
  };
  
  const parseTimeString = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    for (const formatStr of TIME_FORMATS) {
      if (!isMatch(trimmed, formatStr)) continue;
      const parsed = parse(trimmed, formatStr, createZeroReference());
      if (!isValid(parsed)) continue;
      return {
        hours: parsed.getHours(),
        minutes: parsed.getMinutes(),
        seconds: parsed.getSeconds(),
      };
    }
    return null;
  };
  
  const getTimeParts = (value) => {
    if (!value && value !== 0) return null;
    const fromString = parseTimeString(value);
    if (fromString) return fromString;
    const date = coerceDate(value);
    if (!date) return null;
    return {
      hours: date.getUTCHours(),
      minutes: date.getUTCMinutes(),
      seconds: date.getUTCSeconds(),
    };
  };
  
  const parseDateString = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || !isMatch(trimmed, DATE_FORMAT)) return null;
    const parsed = parse(trimmed, DATE_FORMAT, createZeroReference());
    if (!isValid(parsed)) return null;
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
      day: parsed.getDate(),
    };
  };
  
  const getDateParts = (value) => {
    if (!value && value !== 0) return null;
    const fromString = parseDateString(value);
    if (fromString) return fromString;
    const date = coerceDate(value);
    if (!date) return null;
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  };
  
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
  
  export const clinicBuildDateTime = (dateInput, timeInput) => {
    const dateParts = getDateParts(dateInput);
    const timeParts = getTimeParts(timeInput);
    if (!dateParts || !timeParts) return null;
    return new Date(Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      timeParts.hours,
      timeParts.minutes,
      timeParts.seconds ?? 0,
      0
    ));
  };
  
