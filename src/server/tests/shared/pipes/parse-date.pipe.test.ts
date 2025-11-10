import { BadRequestException } from '@nestjs/common'
import { addDays } from 'date-fns'
import { ParseDatePipe } from '../../../src/shared/pipes/parse-date.pipe'

describe('ParseDatePipe', () => {
  let pipe: ParseDatePipe

  beforeEach(() => {
    pipe = new ParseDatePipe()
  })

  it('returns undefined for falsy inputs', () => {
    expect(pipe.transform(undefined)).toBeUndefined()
    expect(pipe.transform(null)).toBeUndefined()
  })

  it('returns Date instances untouched', () => {
    const now = new Date()
    expect(pipe.transform(now)).toBe(now)
  })

  it('parses ISO strings into Date objects', () => {
    const testDate = addDays(new Date(), 20)
    const isoString = testDate.toISOString()
    const parsed = pipe.transform(isoString)
    expect(parsed).toBeInstanceOf(Date)
    expect(parsed?.toISOString()).toBe(testDate.toISOString())
  })

  it('throws BadRequestException for invalid ISO strings', () => {
    expect(() => pipe.transform('not-a-date')).toThrow(BadRequestException)
    expect(() => pipe.transform('2025-13-01')).toThrow(/Invalid date format/)
  })

  it('throws BadRequestException for unsupported types', () => {
    expect(() => pipe.transform(123 as unknown)).toThrow(BadRequestException)
    expect(() => pipe.transform({} as unknown)).toThrow(/Invalid date type/)
  })
})
