import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecurringBookingGroup } from '../../src/components/RecurringBookingGroup'

const buildBooking = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'booking-1',
  roomId: 'room-1',
  start: '07:30:00',
  end: '08:30:00',
  user: 'Jane Doe',
  date: '2025-01-05',
  booking_series_id: 'series-1',
  ...overrides,
})

describe('<RecurringBookingGroup />', () => {
  it('renders nothing when there are no bookings', () => {
    const { container } = render(
      <RecurringBookingGroup bookings={[]} onCancelSeries={jest.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('displays sorted range, time, and allows cancelling the series', () => {
    const onCancelSeries = jest.fn()
    const bookings = [
      buildBooking({ id: 'future', date: '2025-01-15', start: '09:00:00', end: '10:00:00' }),
      buildBooking({ id: 'past', date: '2025-01-05', start: '07:30:00', end: '08:30:00' }),
    ]
    render(<RecurringBookingGroup bookings={bookings} onCancelSeries={onCancelSeries} />)

    expect(screen.getByText(/Recurring \(2 bookings\)/i)).toBeInTheDocument()
    expect(screen.getByText(/2025-01-05 to 2025-01-15/i)).toBeInTheDocument()
    expect(screen.getByText(/7:30 AM → 8:30 AM/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel series/i }))
    expect(onCancelSeries).toHaveBeenCalledWith('series-1')
  })

  it('marks the group as cancelled and hides the cancel action', () => {
    const bookings = [
      buildBooking({ cancelled: true, booking_series_id: 'series-2' }),
      buildBooking({ id: '2', cancelled: true, booking_series_id: 'series-2' }),
    ]

    render(<RecurringBookingGroup bookings={bookings} onCancelSeries={jest.fn()} />)

    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel series/i })).not.toBeInTheDocument()
  })

  it('shows user information when requested', () => {
    const booking = buildBooking({ user: 'registrar-user' })

    render(
      <RecurringBookingGroup
        bookings={[booking]}
        onCancelSeries={jest.fn()}
        showUser
      />,
    )

    expect(screen.getByText(/User:/i)).toBeInTheDocument()
    expect(screen.getByText(/registrar-user/i)).toBeInTheDocument()
  })
})
