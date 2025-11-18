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
    isValid,
  } from 'date-fns';
  import { enGB } from 'date-fns/locale';
  
  // Helper function to format date as DD/MM/YYYY
  const formatDDMMYYYY = (date) => {
    if (!date || !isValid(date)) return '';
    return format(date, 'dd/MM/yyyy');
  };
  
  export const parsedDate = (inputDate) => {
    if (!inputDate) return '';
  
    const date = typeof inputDate === 'string' ? parseISO(inputDate) : inputDate;
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

  export const formatDateOnly = (inputDate) => {
    if (!inputDate) return '';
  
    const date = typeof inputDate === 'string' ? parseISO(inputDate) : inputDate;
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
    
    let date;
    if (typeof inputDate === 'string') {
      // Try parsing ISO format first
      date = parseISO(inputDate);
      // If that fails, try creating a new Date
      if (!isValid(date)) {
        date = new Date(inputDate);
      }
    } else if (inputDate instanceof Date) {
      date = inputDate;
    } else {
      return '';
    }
    
    if (!isValid(date)) return '';
    return formatDDMMYYYY(date);
  }
  