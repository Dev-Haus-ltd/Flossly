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
  