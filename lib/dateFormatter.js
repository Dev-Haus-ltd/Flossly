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
  
  // Helper function to format date as DD/MM/YYYY
  const formatDDMMYYYY = (date) => {
    if (!date || !isValid(date)) return '';
    return format(date, 'dd/MM/yyyy');
  };

  const toValidDate = (inputDate) => {
    if (!inputDate && inputDate !== 0) return null;
    if (inputDate instanceof Date) {
      return isValid(inputDate) ? inputDate : null;
    }
    if (typeof inputDate === 'number') {
      const date = new Date(inputDate);
      return isValid(date) ? date : null;
    }
    if (typeof inputDate === 'string') {
      const trimmed = inputDate.trim();
      if (!trimmed) return null;
      let date = parseISO(trimmed);
      if (!isValid(date)) {
        date = new Date(trimmed);
      }
      return isValid(date) ? date : null;
    }
    return null;
  };
  
  export const parsedDate = (inputDate) => {
    if (!inputDate) return '';
  
    const date = toValidDate(inputDate);
    if (!isValid(date)) return '';
    
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
      return `${formatDDMMYYYY(date)}, ${format(date, 'p', { locale: enGB })}`; // e.g., "25/07/2025, 4:15 PM"
    }
  
    return `${formatDDMMYYYY(date)}, ${format(date, 'p', { locale: enGB })}`; // e.g., "25/07/2024, 4:20 PM"
  }

export const formatDayMonth = (inputDate) => {
  if (!inputDate) return '';
  const date = toValidDate(inputDate);
  if (!isValid(date)) return '';
  return format(date, 'd MMMM', { locale: enGB });
};

export const formatDateOnly = (inputDate) => {
  if (!inputDate) return '';
  
    const date = toValidDate(inputDate);
    if (!isValid(date)) return '';
  
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
  
    // Always return DD/MM/YYYY format
    return formatDDMMYYYY(date);
  }
  
  // Export the DD/MM/YYYY formatter for use throughout the application
  export const formatDateDDMMYYYY = (inputDate) => {
    if (!inputDate) return '';

    const date = toValidDate(inputDate);
    if (!isValid(date)) return '';
    return formatDDMMYYYY(date);
  }

  export const formatDateTime = (inputDate) => {
    const date = toValidDate(inputDate);
    if (!isValid(date)) return '';
    return `${formatDDMMYYYY(date)} ${format(date, 'h:mm a')}`;
  }
  

  const pad2 = (n) => String(n).padStart(2, '0');
  const TIME_FORMATS = [
    'HH:mm:ss',
    'HH:mm',
    'H:mm:ss',
    'H:mm',
    'hh:mm a',
    'h:mm a',
  ];
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

  export const formatTime12Hour = (value) => {
    const parts = getTimeParts(value);
    if (!parts) return '';
    const date = new Date();
    date.setHours(parts.hours, parts.minutes, 0, 0);
    return format(date, 'h:mm a');
  };

  export const formatDisplayDate = (value) => {
    return formatDateDDMMYYYY(value);
  };

  export const formatDisplayTime = (value) => {
    return formatTime12Hour(value);
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

  export const dateToLocalYMD = (date) => {
    if (!date) return '';
    
    
    if (typeof date === 'string') {
  
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      date = new Date(date);
    }
    

    if (date instanceof Date && isValid(date)) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
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
  
