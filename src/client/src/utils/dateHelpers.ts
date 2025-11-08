import { parseISO, formatISO, isBefore, startOfMinute, format } from 'date-fns'

export const isoAt = (dateStr: string, timeStr: string) => {
  return parseISO(`${dateStr}T${timeStr}:00`)
}

export const overlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  isBefore(aStart, aEnd) && isBefore(bStart, aEnd)

export const formatDate = (date: Date) => formatISO(date)

export const getCurrentDate = () => {
  return format(startOfMinute(new Date()), 'yyyy-MM-dd')
}