export const isoAt = (dateStr: string, timeStr: string) => {
  return new Date(`${dateStr}T${timeStr}:00`)
}

export const overlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd

export const formatDate = (date: Date) => date.toISOString()

export const getCurrentDate = () => {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 10)
}