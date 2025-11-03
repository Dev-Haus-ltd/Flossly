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
  if (!inputDate) return ''

  const date = typeof inputDate === 'string' ? parseISO(inputDate) : inputDate

  return format(date, 'yyyy-MM-dd')
}
  